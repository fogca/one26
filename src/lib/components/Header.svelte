<script>
	import Logo from '$lib/components/Logo.svelte';
</script>
<header>

	<nav class="nav">
		<a href="/works" class="h5 bold" lang="en">Archives</a>
		<a href="/office" class="h5 bold" lang="en">About</a>
		<a href="/office" class="h5 bold" lang="en">Contact</a>
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
	letter-spacing: -.05em;
}

header .nav a {margin-right: 10px;}

</style>