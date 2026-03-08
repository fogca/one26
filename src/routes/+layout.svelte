<script lang="ts">
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ShuffleText from '$lib/components/ShuffleText.svelte';
	import { onMount } from 'svelte';
  
	let { children } = $props();
  
	let shuffleTextComponent: ShuffleText;
	let currentPath = $state('');
  
	// works/[slug] uses its own in-page ShuffleText; hide global one there
	function showGlobalShuffle(pathname: string): boolean {
	  if (pathname === '/') return false;
	  if (pathname.startsWith('/works/') && pathname !== '/works') return false;
	  return true;
	}
  
	// 現在のページに応じたbodyクラス
	$effect(() => {
	  const pathname = $page.url.pathname;
	  const body = document.body;
	  
	  // すべてのページクラスを削除
	  body.classList.remove('page-home', 'page-works', 'page-office', 'page-works-detail');
	  
	  // 現在のページに応じてクラスを追加
	  if (pathname === '/') {
		body.classList.add('page-home');
	  } else if (pathname === '/works') {
		body.classList.add('page-works');
	  } else if (pathname === '/office') {
		body.classList.add('page-office');
	  } else if (pathname.startsWith('/works/')) {
		body.classList.add('page-works-detail');
	  }
	});
  
	// ページごとのテキスト定義
	function getPageText(pathname: string): { text: string; enableHover: boolean } {
	  if (pathname === '/') {
		return {
		  text: '', // Homeは別途OPアニメーションで管理
		  enableHover: true
		};
	  } else if (pathname === '/works') {
		return {
		  text: 'Work<br>Archives',
		  enableHover: false
		};
	  } else if (pathname === '/office') {
		return {
		  text: 'Studio &<br>Recruitment',
		  enableHover: false
		};
	  } else if (pathname.startsWith('/works/')) {
		// slug ページ - 実際のプロジェクトタイトルは各ページから設定
		return {
		  text: '', // slugページで個別設定
		  enableHover: false
		};
	  }
	  return {
		text: '',
		enableHover: false
	  };
	}
  
	$effect(() => {
	  const pathname = $page.url.pathname;
	  if (!shuffleTextComponent) return;
	  if (!showGlobalShuffle(pathname)) return;

	  if (pathname !== currentPath) {
		currentPath = pathname;
		const pageConfig = getPageText(currentPath);
		if (pageConfig.text) {
		  shuffleTextComponent.shuffleToText(pageConfig.text);
		}
	  }
	});
  
	onMount(() => {
	  currentPath = $page.url.pathname;
	});
  </script>
  
  <svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="../css/base.css?var=1.00">
	<link rel="stylesheet" href="../css/rendering.css?var=1.00">
	<link rel="stylesheet" href="https://use.typekit.net/iqk5bse.css">
  </svelte:head>
  
  <Header />
  
  <!-- ShuffleText - 全ページ共通（Home・works/[slug]以外。slugは自ページで表示） -->
  {#if showGlobalShuffle($page.url.pathname)}
	<ShuffleText
	  bind:this={shuffleTextComponent}
	  text={getPageText($page.url.pathname).text}
	/>
  {/if}
  
  {@render children()}

  {#if $page.route.id !== '/'}
  <Footer />
{/if}
  

  <style>
	:global(body) {
	  margin: 0;
	  padding: 0;
	  background: #ffffff;
	  color: #000000;
	  font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
	  font-weight: 300;
	}

  </style>