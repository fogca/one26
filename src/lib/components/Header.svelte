<script lang="ts">
	import Logo from '$lib/components/Logo@.svelte';

	const links = [
		{ href: '/works', text: 'Archives' },
		{ href: '/office', text: 'About' },
		{ href: '/contact', text: 'Contact' }
	];

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}
</script>

<header>
	<!-- Mobile only: hamburger toggle. Hidden on desktop via CSS. -->
	<button
		type="button"
		class="hamburger"
		class:open={menuOpen}
		aria-label={menuOpen ? 'Close menu' : 'Open menu'}
		aria-expanded={menuOpen}
		onclick={toggleMenu}
	>
		<span class="line" aria-hidden="true"></span>
		<span class="line" aria-hidden="true"></span>
	</button>

	<!-- Desktop only: inline nav. Hidden on mobile via CSS. -->
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
		<a href="/" class="h1" lang="en" onclick={closeMenu}>
			<Logo />
		</a>
	</div>
</header>

<!-- Mobile drawer — slides in when the hamburger is open -->
<div class="menu-drawer" class:open={menuOpen} aria-hidden={!menuOpen}>
	<nav>
		{#each links as link (link.href)}
			<a href={link.href} class="drawer-link" lang="en" onclick={closeMenu}>
				{link.text}
			</a>
		{/each}
	</nav>
</div>

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

	/* ── Hamburger button (mobile only) ── */
	.hamburger {
		display: none; /* hidden on desktop */
		flex-direction: column;
		gap: 6px;
		width: 30px;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
	}

	.hamburger .line {
		display: block;
		width: 100%;
		height: 1px;
		background-color: currentColor;
		transition:
			transform 0.35s cubic-bezier(0.76, 0, 0.24, 1),
			opacity 0.2s ease;
	}

	/* Open state: morph into a wide, shallow X (30° crossing).
	   translateY = (gap + line-height) / 2 = (6 + 1) / 2 = 3.5px so the
	   lines meet at the vertical center before rotating. */
	.hamburger.open .line:first-child {
		transform: translateY(3.5px) rotate(30deg);
	}
	.hamburger.open .line:last-child {
		transform: translateY(-3.5px) rotate(-30deg);
	}

	/* ── Desktop inline nav ── */
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

	header .nav .link:hover .char {
		transform: rotateX(180deg);
	}

	/* ── Mobile drawer ── */
	.menu-drawer {
		display: none; /* hidden on desktop — desktop uses inline nav */
	}

	@media (max-width: 767px) {
		header {
			padding-top: 25px;
		}

		/* Show hamburger, hide inline nav on mobile */
		.hamburger {
			display: flex;
		}
		header .nav {
			display: none;
		}

		/* Logo at compact mobile size */
		header .home :global(svg) {
			height: 16.5px;
		}

		/* Drawer */
		.menu-drawer {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: var(--background);
			z-index: 99; /* below header (100) so the X stays clickable */
			padding: calc(var(--padding) + 60px) var(--padding) var(--padding);
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.35s ease;
		}

		.menu-drawer.open {
			opacity: 1;
			pointer-events: auto;
		}

		.menu-drawer nav {
			display: flex;
			flex-direction: column;
			gap: 24px;
		}

		.menu-drawer .drawer-link {
			font-size: 28px;
			line-height: 1.1;
			letter-spacing: -0.02em;
			color: var(--key);
			text-decoration: none;
		}
	}
</style>
