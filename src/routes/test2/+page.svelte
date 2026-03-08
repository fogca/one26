<script>
    import GridToPreview from '$lib/components/GridToPreview.svelte';
  
    // あなたの画像パスに置き換えてください
    const products = [
      {
        id: 0,
        name: 'Modern Chair',
        price: '€ 299',
        image: '/images/1.jpg' // ← ここに画像パス
      },
      {
        id: 1,
        name: 'Wooden Table',
        price: '€ 599',
        image: '/images/2.jpg'
      },
      {
        id: 2,
        name: 'Ceramic Vase',
        price: '€ 89',
        image: '/images/3.jpg'
      },
      {
        id: 3,
        name: 'Glass Lamp',
        price: '€ 159',
        image: '/images/4.jpg'
      },
      {
        id: 4,
        name: 'Leather Sofa',
        price: '€ 1299',
        image: '/images/2.jpg'
      },
      {
        id: 5,
        name: 'Oak Cabinet',
        price: '€ 899',
        image: '/images/3.jpg'
      },
      {
        id: 6,
        name: 'Wall Clock',
        price: '€ 79',
        image: '/images/4.jpg'
      },
      {
        id: 7,
        name: 'Metal Shelf',
        price: '€ 399',
        image: '/images/5.jpg'
      }
    ];
  </script>
  
  <GridToPreview {products} />
  
  <style>
    :global(body) {
      margin: 0;
      overflow-x: hidden;
    }
  </style>