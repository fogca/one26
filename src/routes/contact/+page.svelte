<script lang="ts">
	const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB total cap
	const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
	const ACCEPT_ATTR = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';

	const INQUIRY_TYPES = [
		'デザインの依頼・相談',
		'採用・インターンに関して',
		'取材など',
		'その他'
	];

	let name = $state('');
	let company = $state('');
	let email = $state('');
	let inquiryType = $state('');
	let content = $state('');

	let files = $state<File[]>([]);
	let dragActive = $state(false);
	let submitting = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let errorMsg = $state('');

	const totalSize = $derived(files.reduce((sum, f) => sum + f.size, 0));

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	}

	function addFiles(incoming: FileList | File[]) {
		const arr = Array.from(incoming);

		// Type check
		const invalid = arr.filter((f) => !ACCEPTED_TYPES.includes(f.type));
		if (invalid.length > 0) {
			errorMsg = 'JPEG / PNG / PDF のみ添付できます';
			return;
		}

		// Total size check (existing + incoming)
		const next = [...files, ...arr];
		const sum = next.reduce((s, f) => s + f.size, 0);
		if (sum > MAX_TOTAL_BYTES) {
			errorMsg = `添付の合計サイズは ${formatSize(MAX_TOTAL_BYTES)} までです（現在 ${formatSize(sum)}）`;
			return;
		}

		errorMsg = '';
		files = next;
	}

	function removeFile(index: number) {
		files = files.filter((_, i) => i !== index);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
		if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) addFiles(input.files);
		// reset so re-selecting the same file fires change
		input.value = '';
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting) return;

		submitting = true;
		status = 'idle';
		errorMsg = '';

		try {
			const fd = new FormData();
			fd.append('name', name);
			fd.append('company', company);
			fd.append('email', email);
			fd.append('inquiryType', inquiryType);
			fd.append('content', content);
			files.forEach((f) => fd.append('attachments', f));

			const res = await fetch('/api/contact', { method: 'POST', body: fd });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error ?? '送信に失敗しました');
			}

			status = 'success';
			name = company = email = inquiryType = content = '';
			files = [];
		} catch (err) {
			status = 'error';
			errorMsg = err instanceof Error ? err.message : '送信に失敗しました';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Contact / one inc.</title>
</svelte:head>

<main class="contact">
	<div class="grid">
		<!-- Hero title is rendered by the global ShuffleText (see +layout.svelte getPageText('/contact')) -->
		<div class="hero" aria-hidden="true"></div>

		<div class="panel">
			<p class="lead">
				弊社への仕事のご依頼、ご相談、採用、取材などに関するお問い合わせは、<br />
				以下のフォームよりお気軽にご連絡ください。<br />
				お問い合わせいただいた内容を確認のうえ、担当者よりご連絡を差し上げます。
			</p>
			<p class="required-note">*印は必須項目です。</p>

			<form onsubmit={handleSubmit} novalidate>
				<div class="row">
					<label for="name">氏名*</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						placeholder="金子　たろう"
						required
					/>
				</div>

				<div class="row">
					<label for="company">会社名</label>
					<input
						id="company"
						type="text"
						bind:value={company}
						placeholder="株式会社 one"
					/>
				</div>

				<div class="row">
					<label for="email">メールアドレス*</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="your@mailaddress.com"
						required
					/>
				</div>

				<div class="row">
					<label for="inquiryType">お問い合わせ種類*</label>
					<select id="inquiryType" bind:value={inquiryType} required>
						<option value="" disabled>選択してください</option>
						{#each INQUIRY_TYPES as type}
							<option value={type}>{type}</option>
						{/each}
					</select>
				</div>

				<div class="row textarea-row">
					<label for="content">お問い合わせ内容*</label>
					<textarea
						id="content"
						bind:value={content}
						placeholder="可能な限り詳しく教えてください。"
						rows="5"
						required
					></textarea>
				</div>

				<!-- Drag & drop attachment area -->
				<div class="row drop-row">
					<label for="files">添付ファイル</label>
					<div class="drop-wrap">
						<div
							class="drop-area"
							class:active={dragActive}
							ondragover={handleDragOver}
							ondragleave={handleDragLeave}
							ondrop={handleDrop}
							role="region"
							aria-label="ファイル添付エリア"
						>
							<input
								id="files"
								type="file"
								multiple
								accept={ACCEPT_ATTR}
								onchange={handleFileInput}
							/>
							<label for="files" class="drop-label">
								<span>ドラッグ&ドロップ または クリックで選択</span>
								<span class="hint">JPEG / PNG / PDF — 合計 10 MB まで</span>
							</label>
						</div>

						{#if files.length > 0}
							<ul class="file-list">
								{#each files as file, i (file.name + file.size + i)}
									<li>
										<span class="file-name">{file.name}</span>
										<span class="file-size">{formatSize(file.size)}</span>
										<button type="button" onclick={() => removeFile(i)}>
											削除
										</button>
									</li>
								{/each}
							</ul>
							<p class="total-size">
								合計 {formatSize(totalSize)} / {formatSize(MAX_TOTAL_BYTES)}
							</p>
						{/if}
					</div>
				</div>

				{#if errorMsg}
					<p class="error">{errorMsg}</p>
				{/if}

				{#if status === 'success'}
					<p class="success">
						お問い合わせを受け付けました。<br />
						担当者よりご連絡いたしますので、今しばらくお待ちください。
					</p>
				{/if}

				<button type="submit" class="submit" disabled={submitting}>
					{submitting ? '送信中...' : '送信する'}
				</button>
			</form>
		</div>
	</div>
</main>

<style>
	.contact {
		min-height: 100vh;
		background: var(--key, #100088);
		color: var(--white, #fff);
		padding: var(--shuffle-height) var(--padding, 25px) calc(var(--padding, 25px) * 4);
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Empty placeholder column — the global ShuffleText (fixed positioned)
	   visually fills this area with the hero title. */
	.hero {
		min-height: 1px;
	}

	.panel {
		max-width: 540px;
	}

	.lead {
		font-size: 13px;
		line-height: 1.7;
		opacity: 0.9;
		margin: 0 0 12px;
	}

	.required-note {
		font-size: 12px;
		opacity: 0.75;
		margin: 0 0 32px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 140px 1fr;
		align-items: baseline;
		gap: 16px;
		padding: 18px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.4);
	}

	.row label {
		font-size: 13px;
		font-weight: var(--font-weight-light);
		font-variation-settings: 'wght' var(--font-weight-light);
		color: var(--white);
	}

	.row input,
	.row select,
	.row textarea {
		appearance: none;
		background: transparent;
		border: none;
		outline: none;
		color: var(--white);
		font-size: 14px;
		font-family: inherit;
		font-weight: var(--font-weight-light);
		font-variation-settings: 'wght' var(--font-weight-light);
		width: 100%;
		padding: 0;
	}

	.row textarea {
		resize: vertical;
		min-height: 80px;
		line-height: 1.6;
	}

	.row input::placeholder,
	.row textarea::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.row select {
		cursor: pointer;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'><path d='M1 1L6 6L11 1' stroke='white' stroke-width='1.2'/></svg>");
		background-repeat: no-repeat;
		background-position: right center;
		padding-right: 24px;
	}

	.row select option {
		background: var(--key, #100088);
		color: var(--white);
	}

	.textarea-row {
		grid-template-columns: 140px 1fr;
		align-items: start;
	}

	/* ── Drop area ── */
	.drop-row {
		border-bottom: none;
		align-items: start;
	}

	.drop-wrap {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.drop-area {
		position: relative;
		border: 1px dashed rgba(255, 255, 255, 0.4);
		border-radius: 4px;
		padding: 20px;
		transition: border-color 0.2s, background 0.2s;
		cursor: pointer;
	}

	.drop-area.active {
		border-color: var(--white);
		background: rgba(255, 255, 255, 0.06);
	}

	.drop-area input[type='file'] {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	.drop-label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		text-align: center;
		pointer-events: none;
	}

	.drop-label .hint {
		font-size: 11px;
		opacity: 0.6;
	}

	.file-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.file-list li {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 12px;
		align-items: center;
		font-size: 12px;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 3px;
	}

	.file-list .file-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-list .file-size {
		opacity: 0.7;
	}

	.file-list button {
		appearance: none;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.4);
		color: var(--white);
		font-size: 11px;
		padding: 3px 10px;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.file-list button:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.total-size {
		font-size: 11px;
		opacity: 0.7;
		margin: 0;
		text-align: right;
	}

	.error {
		color: #ffb3b3;
		font-size: 12px;
		margin: 12px 0 0;
	}

	.success {
		color: #b3ffce;
		font-size: 13px;
		margin: 12px 0 0;
	}

	.submit {
		appearance: none;
		background: var(--white);
		color: var(--key, #100088);
		border: none;
		padding: 16px 48px;
		font-size: 14px;
		font-weight: var(--font-weight-regular);
		font-variation-settings: 'wght' var(--font-weight-regular);
		font-family: inherit;
		cursor: pointer;
		margin-top: 32px;
		align-self: flex-start;
		transition: opacity 0.2s;
	}

	.submit:hover:not(:disabled) {
		opacity: 0.85;
	}

	.submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 1024px) {
		.grid {
			grid-template-columns: 1fr;
			gap: 40px;
		}
	}

	@media (max-width: 640px) {
		.contact {
			padding: 0 15px 60px;
		}

		.row {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.textarea-row,
		.drop-row {
			grid-template-columns: 1fr;
		}
	}
</style>
