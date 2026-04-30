<script lang="ts">
</script>
  
  <svelte:head>
	<title>Office - Kazuki Kaneko / one inc.</title>
  </svelte:head>
  
<section class="Office">
<div class="wrapper">
	<h2 class="h2 uppercase mb-20" lang="en">We opt for a novel experience</h2>
	<p class="">one inc. は、グラフィックやデジタルメディアなど、多岐にわたるヴィジュアルコミュニケーションを軸に活動するクリエイティブスタジオです。私たちは、ブランド構築に関連する様々な領域のサービスを提供し、ヴィジュアルアイデンティティから成るブランドデザインに重きを置いています。今までの多様な経験を活かしながらも、既存の枠組みにとらわれない新たな視点を持ち続け、常に最善の方法を探求しています。ブランドの本質を理解し体現することにより、本来の目的と意義に焦点を当て、従来の枠組みとは異なる、今までにない新しい価値や体験を提供します。 デザインとは、単に視覚的なアウトプットを指す言葉ではありません。私たちは、物事の在り方、存在意義、そして社会における役割という根源的な問いから考えることこそが、本来のクリエイーションであると信じています。ブランドの核となる思想を正しく理解し、それを具体的な体験へと翻訳することで、従来の枠組みを超えた、今までにない新しい価値を提供します。クライアントと共に歩むパートナーとして、本来の目的と意義に焦点を当て、時代に流されることのない普遍性と、未来を切り拓く革新性が共存するヴィジュアルコミュニケーションを創造し続けます。</p>
	<p lang="en" style="display: none;">one inc. is a creative and design consulting studio focused on visual communication across various media, including graphic and digital experiences. We provide a wide range of services in brand building, with a particular emphasis on brand design rooted in visual identity.While leveraging our diverse experience, we maintain a fresh perspective unbound by conventional frameworks, constantly exploring the most effective methods for each project. By understanding and embodying the essence of a brand, we focus on its original purpose and significance, delivering new values and experiences that transcend traditional boundaries.We believe that design is not merely about visual output; true creation stems from questioning the fundamental nature, purpose, and social role of a subject. By deeply understanding a brand’s core philosophy and translating it into tangible experiences, we provide innovative value that goes beyond the ordinary.As a partner walking alongside our clients, we remain focused on the original intent and meaning, continuing to create visual communications where timeless universality and forward-thinking innovation coexist.</p>

</div>

<hr class="my-80">

<div class="wrapper">
	<h2 class="h0 mb-10" lang="en">Services</h2>
	<p>私たちは、ブランドの本質を形にするために、戦略的思考とクリエイティブ実践を統合したサービスを提供します。ヴィジュアルアイデンティティの構築から、グラフィック、デジタル、空間までブランド体験のあらゆる接点を一貫した視点で設計します。</p>
	<div class="container mt-40">
		<div class="box mb-30">
			<h3 class="h3 mb-10 bold" lang="en">Brand Foundation</h3>
			<ul>
				<li class="h3">戦略リサーチ</li>
				<li class="h3">ブランド構築</li>
				<li class="h3">ポジショニング & メッセージング</li>
				<li class="h3">ネーミング & 言語開発</li>
				<li class="h3">トーン & ボイス</li>
			</ul>
		</div>
		<div class="box mb-30">
			<h3 class="h3 mb-10 bold" lang="en">Identity Systems</h3>
			<ul>
				<li class="h3">ヴィジュアルアイデンティティ</li>
				<li class="h3">デザインシステム</li>
				<li class="h3">タイポグラフィデザイン</li>
				<li class="h3">カラー & フォルム言語</li>
				<li class="h3">ブランドガイドライン</li>
			</ul>
		</div>
		<div class="box mb-30">
			<h3 class="h3 mb-10 bold" lang="en">Physical Expression</h3>
			<ul>
				<li class="h3">グラフィックデザイン</li>
				<li class="h3">パッケージデザイン</li>
				<li class="h3">エディトリアル & 出版</li>
				<li class="h3">環境グラフィックス</li>
				<li class="h3">展示会 & 空間</li>
			</ul>
		</div>
		<div class="box">
			<h3 class="h3 mb-10 bold" lang="en">Digital Touchpoints</h3>
			<ul>
				<li class="h3">Webデザイン</li>
				<li class="h3">インターフェイスデザイン</li>
				<li class="h3">ユーザーエクスペリエンス</li>
				<li class="h3">モバイルアプリケーション</li>
				<li class="h3">データビジュアライゼーション</li>
			</ul>
		</div>
		<style>
		    .Office .box h3 {font-size: 18px;}
			.Office .box ul li {font-size: 18px;}
		</style>

	</div>
</div>


</section>
  


<style>


.Office {
	padding-top: calc(var(--shuffle-height) + 10px);
}

.Office .wrapper,.Office hr {
	width: 65%;
	width: 50%;
	margin-left: auto;
	margin-right: 0;
	padding-right: 0;
}

.Office hr {
	width: 50%;
    margin-right: 0;
	background-color: var(--key);
	height: .5px;
	border: none;
}



.Office .wrapper {margin-bottom: 0;}
.Office .wrapper:nth-last-of-type(1) {margin-bottom: 0;padding-bottom: 8rem;}


.Office .wrapper p {text-align: justify;}
.Office .wrapper p {hyphens: auto;}

@media (max-width: 767px) {
	/* Drop the desktop-only 50% inset on mobile — full bleed */
	.Office .wrapper,
	.Office hr {
		width: 100%;
		margin-left: 0;
		margin-right: 0;
	}

	/* Override .my-80 utility on mobile — tighter spacing + softer line */
	.Office hr.my-80 {
		margin-top: 50px;
		margin-bottom: 50px;
		opacity: 0.3;
	}

	.Office .box ul li {
		font-size: 14px;
		line-height: 1.6;
	}
}

</style>