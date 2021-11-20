<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Col, Container, Row } from 'sveltestrap';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import { first } from './boardUpdate.svelte'; 
	import { table } from './store.js';

	onMount(() => {
		first();
	});

 let pieces = [];

	table.subscribe(val => {
		let currentPieces = [];
		for(const rowCount in val) {
			const row = val[rowCount];
			for(const cellCount in row) {
				const cell = row[cellCount];
				const  horizontal= 8 - Number(rowCount);
				const vertical = 8 - Number(cellCount); 
				currentPieces.push({
					name: cell.toString(),
					square: vertical+''+horizontal
				})
			}
		}
		pieces = currentPieces;
		console.log(pieces);
	});
</script>
<svelte:head>
  <link rel="stylesheet" href="style.css">
</svelte:head>


<main>
	<Container class="container">
		<Row>
		  <Col xl=12>
			<div class="board">
			{#each pieces as piece}
				<div class="piece square-{piece.square} {piece.name}"></div>
			{/each}
			</div>
		</Col>
		<Button class="reset" on:click={first}>reset</Button>
		</Row>
	  </Container>
</main>
