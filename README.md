# Business Simulator - Moteur de Simulation Dynamique

Un jeu mobile de gestion ou le joueur part de zero et construit un empire economique.

## Architecture

```
src/
  engine/
    WorldState.ts          - Etat global du monde (economie, meteo, saisons)
    SeasonWeatherEngine.ts - Moteur meteo et saisons
    EconomyEngine.ts       - Simulation economique globale
    EventEngine.ts         - Moteur d'evenements aleatoires ponderes
    BusinessEngine.ts      - Logique metier par type d'entreprise
    GameLoop.ts            - Boucle de jeu principale (1 tick = 1 jour in-game)
  data/
    events.ts              - Definitions de tous les evenements
    businesses.ts          - Types d'entreprises et leurs sensibilites
    config.ts              - Constantes d'equilibrage
  models/
    Player.ts              - Modele joueur
    Business.ts            - Modele entreprise
    Employee.ts            - Modele employe
    Loan.ts                - Modele emprunt
  utils/
    random.ts              - Utilitaires de probabilites
```

## Principes

- **Zero IA externe** : toute la simulation repose sur des probabilites, des variables economiques, des regles logiques et des evenements ponderes.
- **Monde vivant** : meteo, saisons, cycles economiques et evenements creent un environnement dynamique et imprevisible.
- **Equilibrage** : le systeme utilise des bornes min/max, un lissage progressif, et une difficulte adaptative pour rester fun sans etre injuste.

## Stack

- TypeScript
- Moteur de simulation pur (pas de dependance framework UI)
- Pret a integrer dans React Native, Flutter, ou tout framework mobile
