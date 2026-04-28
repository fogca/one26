<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

  const submitSort = (event: Event) => {
    const target = event.currentTarget as HTMLSelectElement | null;
    target?.form?.submit();
  };
</script>

<svelte:head>
  <title>Project List | Kazuki Kaneko / one inc.</title>
</svelte:head>

<section class="works-list">
  <div class="sort-wrap">
    <form method="GET" class="sort-form">
      <label for="sort" class="sort-label" lang="en">Sort</label>
      <select id="sort" name="sort" class="sort-select" onchange={submitSort}>
        <option value="default" selected={data.sort === 'default'} lang="en">Default</option>
        <option value="new" selected={data.sort === 'new'} lang="en">New to Old</option>
      </select>
    </form>
  </div>

  <div class="wrapper">
    {#each data.works as work}
      <a class="container" href="/works/{work.id}">
        {#if work.thumbnail?.url}
          <img src={work.thumbnail.url} alt={work.title} loading="lazy" />
        {/if}

        <div class="box">
          <div>
            <span lang="en">{work.category || 'Project'}</span>
            <span lang="en">{formatDate(work.publishedAt)}</span>
          </div>
          <h2 class="h2" lang="en">{work.title}</h2>
          <div></div>
        </div>
      </a>
    {/each}
  </div>
</section>

<style>
  .works-list {
    padding-top: 120px;
    padding-bottom: 60px;
  }

  .sort-wrap {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 32px;
  }

  .sort-form {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }

  .sort-label {
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sort-select {
    min-width: 150px;
    padding: 6px 10px;
    border: 1px solid var(--key);
    border-radius: 2px;
    font-size: 13px;
    background: transparent;
  }

  .wrapper {
    display: flex;
    flex-direction: column;
    width: 70%;
    margin-left: auto;
    margin-right: 0;
    grid-template-columns: 1fr;
  }

  .container {
    display: flex;
    padding: 30px 20px;
    border-bottom: .5px solid var(--key);
  }
  .container:nth-of-type(1) {border-top: .5px solid var(--key);}

  .container img {
    width: auto;
    height: 180px;
    height: 20vh;
    aspect-ratio: 3 / 2;
    object-fit: cover;
    margin-right: 40px;
  }


  .box {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .box span {
    font-size: 11px;
    line-height: 1.4;
    font-variation-settings: 'wght' 450; 
  }

  .box h2 {
    font-size: 28px;
    margin-top: -10px;
    font-variation-settings: 'wght' 320; 
    transition: font-variation-settings 0.5s ease-in-out;
  }


  a.container img {filter: saturate(1);}
  a.container:hover img {filter: saturate(1);}
  a.container:hover {
    opacity: 1;
    background-color: var(--key);
  }
  a.container:hover * {color: var(--white);}
  a.container:hover h2 {
    transition: font-variation-settings 0.5s ease-in-out;
    font-variation-settings: 'wght' 520;}

  a.container img,
  a.container .box {transition: transform 0.5s;}
  a.container:hover img,
  a.container:hover .box {
    transition: transform 0.5s;
    transform: translateX(10px);
  }
  a.container:hover .box {transform: translateX(5px);}

  @media (max-width: 767px) {
    .works-list {
      padding-top: 90px;
      padding-bottom: 40px;
    }

    .sort-wrap {
      margin-bottom: 24px;
    }

    .wrapper {
      grid-template-columns: 1fr;
      gap: 24px;
      /* Drop the desktop-only 70% inset on mobile — full bleed */
      width: 100%;
      margin-left: 0;
    }

    .box h2 {
      font-size: 18px;
    }
  }
</style>