<script lang="ts">
	import { Col, Container, Row } from 'sveltestrap';
	import 'bootstrap/dist/css/bootstrap.min.css';
</script>
<svelte:head>
  <link rel="stylesheet" href="style.css">
</svelte:head>


<main>
	<Container class="container">
		<Row>
		  <Col>
			<div class="board"></div>
		</Col>
		</Row>
	  </Container>
</main>
