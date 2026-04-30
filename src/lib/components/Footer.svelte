<script>
    import LogoEn from '$lib/components/Logo@.svelte';
</script>

<footer>
<hr class="mb-40">
<div class="wrapper">
    <div class="container">
        <p class="mb-20">コラボレーションや協業のご相談など、<br>
            ぜひお気軽にお問い合わせください。</p>
        <p class="mb-10">
            <a href="/contact" class="contact-link" data-hover="Discover">Contact</a>
        </p>
        <p class="mb-40">
            <a
                href="https://www.instagram.com/one.inc.tokyo/"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-link"
                data-hover="Visit"
            >Instagram</a>
        </p>
        <p class="copyright">©one inc., 2026</p>
    </div>
    <div class="container">
        <LogoEn />
    </div>
</div>

</footer>

<style>
    footer {
        width: 100%;
        height: auto;
        min-height: 200px;
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

    /* The animated text Logo lives in the right column. No font-size override —
       it inherits the Logo component's own sizes (24px base, 28px ≥768px) so
       the footer mark matches the header logo exactly. */

    /* Contact / Instagram are visited inline links with a thin underline. They
       sit at regular weight — the previous medium-weight `Contact →` was too
       loud now that Instagram lives next to it. */
    footer .contact-link {
        color: inherit;
        text-decoration: none;
        border-bottom: .5px solid currentColor;
        padding-bottom: 2px;
        font-weight: var(--font-weight-regular);
        font-variation-settings: 'wght' var(--font-weight-medium);
        transition: opacity 0.2s ease;
    }
    footer .contact-link:hover {
        opacity: 0.6;
    }

    /* Copyright line is bumped to medium so it carries weight visually and
       balances the animated Logo on the opposite side of the footer. */
    footer .copyright {
        font-weight: var(--font-weight-medium);
        font-variation-settings: 'wght' var(--font-weight-medium);
    }

    @media (max-width: 767px) {
        footer {
            height: auto;
            padding-bottom: 20px;
        }
        /* Mobile: give the copy column more room so the lead sentence doesn't
           wrap awkwardly mid-word. Logo column shrinks to compensate. */
        footer .container:nth-of-type(1) {
            width: 70%;
        }
        footer .container:nth-of-type(2) {
            width: 30%;
        }
    }
</style>
