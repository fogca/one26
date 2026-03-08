<script lang="ts">
	export let data;
	
	console.log('Projects data:', data.projects);
</script>

<div class="test-page">
	<h1>microCMS Image Test</h1>
	
	<div class="debug-info">
		<h2>Debug Info</h2>
		<p>Total projects: {data.projects.length}</p>
		<pre>{JSON.stringify(data.projects, null, 2)}</pre>
	</div>

	<div class="simple-grid">
		{#each data.projects as project}
			<div class="project-card">
				<h3>{project.title}</h3>
				<p>ID: {project.id}</p>
				
				<div class="images">
					{#each project.images as image, i}
						<div class="image-wrapper">
							<p>Image {i + 1}:</p>
							<p class="url">{image.url}</p>
							<img src={image.url} alt={image.alt} />
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.test-page {
		padding: 40px;
		max-width: 1400px;
		margin: 0 auto;
	}

	h1 {
		margin-bottom: 30px;
	}

	.debug-info {
		background: #f5f5f5;
		padding: 20px;
		border-radius: 8px;
		margin-bottom: 40px;
	}

	.debug-info pre {
		overflow: auto;
		max-height: 300px;
		background: white;
		padding: 15px;
		border-radius: 4px;
		font-size: 12px;
	}

	.simple-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 30px;
	}

	.project-card {
		border: 2px solid #ddd;
		padding: 20px;
		border-radius: 8px;
	}

	.project-card h3 {
		margin-top: 0;
		color: #333;
	}

	.images {
		margin-top: 15px;
	}

	.image-wrapper {
		margin-bottom: 20px;
		padding: 10px;
		background: #f9f9f9;
		border-radius: 4px;
	}

	.image-wrapper p {
		margin: 5px 0;
		font-size: 14px;
	}

	.url {
		font-size: 11px;
		color: #666;
		word-break: break-all;
		font-family: monospace;
	}

	.image-wrapper img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		border: 1px solid #ddd;
		border-radius: 4px;
		margin-top: 10px;
	}
</style>