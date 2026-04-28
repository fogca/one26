<!-- +page.svelte など -->
<script>
	import SplitTextReveal from '$lib/components/GsapSplit.svelte';
</script>




<section>
<SplitTextReveal>
	<h1>Causes
       erlay — The whole overlay was faded to opacity: 0, so even if the text had stayed mounted, it would have been invisible.
        
        Keep the final line for both step 2 and 3:
        so the same ShuffleText instance stays mounted and the shuffle can finish.
        Fade only the background instead of the whole overlay:
    so the solid backdrop fades out while the copy stays at full opacity
        ShuffleText.svelte was not changed; behavior is unchanged.
        
        If the line is hard to read over the gallery after the bg fades, we can add a light text shadow or a small backdrop behind the line — say if you want that.</h1>
</SplitTextReveal>
</section>


<style>

section {
    padding-top: 500px;
    min-height: 100vh;
}

h1 {
    font-size: 16px;
    line-height: 1;
    width: 50%;
}

:global h1 div {line-height: 1.4;}

</style>