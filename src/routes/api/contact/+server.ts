import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const POST: RequestHandler = async ({ request }) => {
	const resendApiKey = env.RESEND_API_KEY;
	const contactToEmail = 'one@takumiisobe.com';
	const contactFromEmail = 'onboarding@resend.dev';

	if (!resendApiKey) {
		console.error('[contact] missing required env vars');
		return new Response(
			JSON.stringify({ error: 'メール設定が未完了です' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const resend = new Resend(resendApiKey);
	const fd = await request.formData();

	const name = String(fd.get('name') ?? '').trim();
	const company = String(fd.get('company') ?? '').trim();
	const email = String(fd.get('email') ?? '').trim();
	const inquiryType = String(fd.get('inquiryType') ?? '').trim();
	const content = String(fd.get('content') ?? '').trim();

	// Basic validation
	if (!name || !email || !inquiryType || !content) {
		return new Response(
			JSON.stringify({ error: '必須項目が未入力です' }),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	// Collect & validate attachments
	const rawFiles = fd.getAll('attachments').filter((v): v is File => v instanceof File);

	let totalBytes = 0;
	for (const f of rawFiles) {
		if (!ACCEPTED_TYPES.includes(f.type)) {
			return new Response(
				JSON.stringify({ error: 'JPEG / PNG / PDF のみ添付できます' }),
				{ status: 400, headers: { 'Content-Type': 'application/json' } }
			);
		}
		totalBytes += f.size;
	}
	if (totalBytes > MAX_TOTAL_BYTES) {
		return new Response(
			JSON.stringify({ error: '添付の合計サイズが10MBを超えています' }),
			{ status: 400, headers: { 'Content-Type': 'application/json' } }
		);
	}

	const attachments = await Promise.all(
		rawFiles.map(async (f) => ({
			filename: f.name,
			content: new Uint8Array(await f.arrayBuffer())
		}))
	);

	// Shared inquiry summary (used in both team-mail and auto-reply)
	const inquirySummary = [
		`お問い合わせ種類: ${inquiryType}`,
		`氏名: ${name}`,
		`会社名: ${company || '-'}`,
		`メールアドレス: ${email}`,
		'',
		'─── お問い合わせ内容 ───',
		content
	].join('\n');

	// Mail #1 — team notification
	const teamMail = [
		inquirySummary,
		'',
		`添付ファイル: ${rawFiles.length > 0 ? rawFiles.map((f) => f.name).join(', ') : 'なし'}`
	].join('\n');

	// Mail #2 — auto-reply to the inquirer
	const autoReply = [
		`${name} 様`,
		'',
		'お問い合わせありがとうございます。',
		'以下の内容で受け付けましたので、よろしくお願いいたします。',
		'担当者より改めてご連絡差し上げます。',
		'',
		'─────────────────────',
		inquirySummary,
		'─────────────────────',
		'',
		'※ このメールは自動送信です。本メールへの返信ではお問い合わせいただけません。',
		'',
		'one inc.'
	].join('\n');

	try {
		// Send both in parallel — auto-reply failure should not block team notification
		const [teamResult, replyResult] = await Promise.allSettled([
			resend.emails.send({
				from: contactFromEmail, // 認証済みドメインのアドレス（例: noreply@one.inc）
				to: contactToEmail,     // 受信先（例: hello@one.inc）
				replyTo: email,
				subject: `[Contact] ${inquiryType} — ${name}`,
				text: teamMail,
				attachments
			}),
			resend.emails.send({
				from: contactFromEmail,
				to: email,                // 問い合わせた本人
				replyTo: contactToEmail, // 返信は team 宛に
				subject: 'お問い合わせを受け付けました — one inc.',
				text: autoReply
				// 添付は付けない（送信者のメール容量を圧迫しない）
			})
		]);

		// Team mail is the critical one — fail the request only if it errored
		if (teamResult.status === 'rejected' || (teamResult.status === 'fulfilled' && teamResult.value.error)) {
			const err = teamResult.status === 'rejected' ? teamResult.reason : teamResult.value.error;
			console.error('[contact] team mail error', err);
			return new Response(
				JSON.stringify({ error: 'メール送信に失敗しました' }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}

		// Log auto-reply failures but don't fail the whole request
		if (replyResult.status === 'rejected' || (replyResult.status === 'fulfilled' && replyResult.value.error)) {
			const err = replyResult.status === 'rejected' ? replyResult.reason : replyResult.value.error;
			console.error('[contact] auto-reply error (non-blocking)', err);
		}

		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('[contact] unexpected error', err);
		return new Response(
			JSON.stringify({ error: '予期しないエラーが発生しました' }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } }
		);
	}
};
