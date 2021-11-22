<script lang="ts">
	import { Button, Col, Container, Row } from 'sveltestrap';
	import 'bootstrap/dist/css/bootstrap.min.css';
	import { afterUpdate } from 'svelte';
	import { table } from './store';
	import { first } from './boardUpdate.svelte';


 let pieces = [];
 let currentPieces = [];
 let move = '';

 table.subscribe(val => {
	let currentTable = val;
		currentPieces = [];
		for(const rowCount in currentTable) {
			const row = currentTable[rowCount];
			for(const cellCount in row) {
				const cell = row[cellCount];
				const  horizontal= 8 - Number(rowCount);
				const vertical = 8 - Number(cellCount);
				currentPieces.push({
					name: cell.toString(),
					square: vertical+''+horizontal,
				})
			}
		}
		pieces = [];
 });

 afterUpdate(() => {
		pieces = currentPieces;
	});



function drag(e) {
	console.log(e);
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
						{#each pieces as piece}
							{#if piece.name !== ''}
								<div class="piece square-{piece.square} {piece.name}"></div>
							{:else}
								<div class="square-{piece.square}"></div>
							{/if}
						{/each}
				</div>
			</Col>
			<Button class="reset" on:click={first}>reset</Button>
		</Row>
	  </Container>
</main>
