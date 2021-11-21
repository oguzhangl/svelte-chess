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
 let state = false;

	table.subscribe(val => {
		state = false;
		setTimeout(function () {
		let currentTable = val;
		let currentPieces = [];
		for(const rowCount in currentTable) {
			const row = currentTable[rowCount];
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
		state = true;
		console.log(pieces);
		},100)
	});


	function draging(elem) {
		console.log(elem);
	}
</script>
<svelte:head>
  <link rel="stylesheet" href="style.css">
</svelte:head>


<main>
	<Container class="container">
		<Row>
		  <Col xl=12>
			<div class="board">
				{#if state}
					{#each pieces as piece}
					{#if piece.name !== ''}
						<div class="piece square-{piece.square} {piece.name}"  on:drag={draging}></div>
						{:else}
						<div class="piece square-{piece.square} {piece.name}"></div>
						{/if}
					{/each}	
				{/if}
			</div>
			
		</Col>
		<Button class="reset" on:click={first}>reset</Button>
		</Row>
	  </Container>
</main>
