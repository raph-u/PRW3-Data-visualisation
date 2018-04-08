# Scripts
L'intégralité du code utilisé dans le cadre de ce projet se trouve sous le répertoire ```PRW3-DataParser\scr\prw3\dataparser```. Ce code a été conçu de manière à intéragir avec la liste de fichiers suivants:

***Liste des fichiers***
- Nombre de SMS envoyés par canton (Juillet 2017): https://opendata.swisscom.com/explore/dataset/nombre-de-sms-envoyes-par-canton-201707/download/?format=json&timezone=Europe/Berlin
- Nombre d’appels vocaux par canton (Juillet 2017): https://opendata.swisscom.com/explore/dataset/nombre-dappels-vocaux-par-canton-201707/download/?format=json&timezone=Europe/Berlin
- Téléchargement de données effectif par canton et par heure (Juillet 2017): https://opendata.swisscom.com/explore/dataset/effektiver-datendownload-pro-kanton-und-stunde-fr/download/?format=json&timezone=Europe/Berlin

## PRW3DataParser.java
Classe de base du projet. C'est en son sein qu'est déclenchée la procédure de récupération des données.

## Parser.java
Cette classe est chargée d'extraire les données des fichiers JSON du portail Open data de Swisscom afin de les traiter et les agréger dans de nouveaux fichiers JSON qui seront directement utilisés par le code Javascript du projet de visualisation.

## Fonctionnement général
Lors du lancement du programme, ```PRW3DataParser```, la classe de base, déclenche la récupération des données issues des fichiers téléchargés sur la plateforme Open Data de swisscom. Ces données sont ensuites agrégées au sein de 3 fichiers JSON distincts qui correspondent aux données traitées qui seront utilisées pour ce projet.
