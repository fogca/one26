<script>
    import LogoEn from '$lib/components/Logo@.svelte';
</script>

<footer>
<hr class="mb-40">
<div class="wrapper">
    <div class="container">
    <p class="mb-40">コラボレーションや協業のご相談など、<br>
        ぜひお気軽にお問い合わせください。</p>
        <p>©one inc., 2026</p>
    </div>
    <div class="container">
        <LogoEn />
    </div>
</div>

</footer>

<style>
    footer {
        width: 100%;
        height: 200px;
        padding: 20px var(--padding) 30px;
        position: relative;
        z-index: 2;
        background-color: var(--white);
    }

    footer hr {
        width: 100%;
        height: .5px;
        border: none;
        background-color: var(--key);
    }

    footer .wrapper {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
    }

    footer .container {
        width: 50%;
    }
    footer .container:nth-of-type(2) {text-align: right;}

    footer .container :global(svg) {
        width: 40%;
        height: auto;
        margin-left: auto;
        margin-right: 0;
    }
</style>