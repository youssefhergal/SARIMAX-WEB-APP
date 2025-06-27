# SARIMAX Modern Web Application

## 🚀 Client-Side SARIMAX Implementation

Cette application web moderne utilise **SolidJS + Vite + Tailwind CSS** et exécute **tout l'algorithme SARIMAX directement dans le navigateur** - aucun serveur backend requis !

## ✨ Fonctionnalités

- 📁 **Upload de fichiers BVH** - Drag & drop pour fichiers d'entraînement et de test
- ⚙️ **Configuration SARIMAX** - Paramètres p, d, q personnalisables
- 📊 **Analyse en temps réel** - Traitement côté client avec indicateur de progression
- 📈 **Visualisations interactives** - Graphiques Plotly.js intégrés
- 📋 **Métriques détaillées** - MSE, MAE, U-Theil, corrélation
- 🎨 **Interface moderne** - Design responsive avec animations

## 🏗️ Architecture

```
SARIMAX WEB app/
├── src/
│   ├── components/          # Composants SolidJS
│   │   ├── Dashboard.jsx    # Layout principal
│   │   ├── Sidebar.jsx      # Contrôles et configuration
│   │   ├── MainContent.jsx  # Visualisations et métriques
│   │   ├── PlotViewer.jsx   # Graphiques Plotly.js
│   │   └── ...
│   ├── context/
│   │   └── AppContext.jsx   # État global et logique SARIMAX
│   └── index.jsx            # Point d'entrée
├── package.json             # Dépendances frontend uniquement
├── vite.config.js          # Configuration Vite (sans proxy)
└── tailwind.config.js      # Configuration Tailwind
```

## 🔧 Modules SARIMAX Importés

L'application importe directement les modules depuis le répertoire parent :

```javascript
import { SARIMAX } from '../../../classes/SARIMAX.js';
import { StandardScaler } from '../../../classes/StandardScaler.js';
import { extractDataFromBVH } from '../../../utils/bvhUtils.js';
import { performStaticForecasting } from '../../../forecasting/staticForecasting.js';
import { performDynamicForecasting } from '../../../forecasting/dynamicForecasting.js';
import { calculateMetrics } from '../../../utils/metrics.js';
```

## 🚀 Démarrage

### Option 1 - Script automatique
```bash
./start-dev.bat
```

### Option 2 - Manuel
```bash
npm install
npm run dev
```

L'application sera disponible sur http://localhost:3000

## 💡 Avantages de l'Architecture Client-Side

- ✅ **Pas de serveur requis** - Déploiement statique possible
- ✅ **Traitement local** - Données BVH restent sur la machine de l'utilisateur
- ✅ **Performance** - Pas de latence réseau pour les calculs
- ✅ **Simplicité** - Une seule application à maintenir
- ✅ **Sécurité** - Pas de transfert de données sensibles

## 🔄 Workflow

1. **Upload** : Glisser-déposer les fichiers BVH train/test
2. **Configuration** : Sélectionner le joint cible et paramètres SARIMAX
3. **Analyse** : Cliquer "Start Analysis" - tout se fait dans le navigateur
4. **Résultats** : Visualiser graphiques interactifs et métriques
5. **Export** : Télécharger les résultats (fonctionnalité à implémenter)

## 🎯 Technologies

- **Frontend** : SolidJS, Vite, Tailwind CSS
- **Visualisation** : Plotly.js
- **Algorithme** : SARIMAX JavaScript pur
- **Parsing** : BVH parser JavaScript intégré

## 📊 Métriques Calculées

- **MSE** : Mean Squared Error
- **MAE** : Mean Absolute Error  
- **U-Theil** : Theil's U statistic
- **Corrélation** : Coefficient de corrélation

## 🔮 Prochaines Étapes

- [ ] Export des résultats (CSV/JSON)
- [ ] Comparaisons multi-modèles
- [ ] Paramètres SARIMAX avancés
- [ ] Sauvegarde/chargement de configurations
- [ ] Mode offline complet (PWA) 