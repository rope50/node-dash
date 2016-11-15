# node-dash
Reproductor de video web que busca recrear de forma fiel la experiencia de un usuario de Youtube, con tiempos de espera y cambios de calidad. Probado en el navegador Google Chrome.

### Instalación
```
	npm install
```

### Para ejecutar:
```
	npm start
```
Luego se puede visualizar el reproductor en http://localhost:3000

### Contenido:

- node-dash: Modulo para node.js que se encarga de ir a buscar el archivo manifiesto de un recurso de youtube por su ID.
- dash-client: Librería javascript para navegador para la reproducción de video utlizando los datos entregados por la api de node-dash.