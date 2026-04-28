<script>
	import Logo from '$lib/components/Logo@.svelte';

	const links = [
		{ href: '/works', text: 'Archives' },
		{ href: '/office', text: 'About' },
		{ href: '/contact', text: 'Contact' }
	];
</script>

<header>
	<nav class="nav">
		{#each links as link (link.href)}
			<a href={link.href} class="h5 bold link" lang="en">
				{#each link.text.split('') as ch, i}
					<span class="char" style:--i={i}>
						<span class="face front">{ch}</span>
						<span class="face back" aria-hidden="true">{ch}</span>
					</span>
				{/each}
			</a>
		{/each}
	</nav>

	<div class="home">
		<a href="/" class="h1" lang="en">
			<Logo />
		</a>
	</div>
</header>

<style>
	header {
		width: 100%;
		height: auto;
		position: fixed;
		left: 0;
		top: 0;
		padding: var(--padding);
		padding-top: calc(var(--padding) - 5px);
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	header .home a {
		font-size: 18px;
		letter-spacing: -0.05em;
	}

	/* 3D flip nav links — each char is an independent flippable card */
	header .nav .link {
		margin-right: 10px;
		display: inline-block;
		perspective: 600px;
	}

	header .nav .char {
		position: relative;
		display: inline-block;
		transform-style: preserve-3d;
		transition: transform 0.45s cubic-bezier(0.76, 0, 0.24, 1);
		transition-delay: calc(var(--i, 0) * 0.04s);
	}

	header .nav .face {
		display: inline-block;
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
	}

	header .nav .face.back {
		position: absolute;
		inset: 0;
		transform: rotateX(180deg);
	}

	/* On hover, every char flips 180° on the X-axis (staggered via --i) */
	header .nav .link:hover .char {
		transform: rotateX(180deg);
	}

	@media (max-width: 767px) {
		header {
			padding-top: 25px;
		}
	}
</style>
