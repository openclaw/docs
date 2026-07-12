---
read_when:
    - Dépannage des invites d’autorisation macOS absentes ou bloquées
    - Décider s’il faut accorder l’accès à l’accessibilité à Node ou à un environnement d’exécution CLI
    - Empaquetage ou signature de l’app macOS
    - Modification des identifiants de bundle ou des chemins d’installation de l’application
summary: Persistance des autorisations macOS (TCC) et exigences de signature
title: Autorisations macOS
x-i18n:
    generated_at: "2026-07-12T02:48:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

Les autorisations macOS sont fragiles. TCC associe une autorisation à la signature de code de l’application, à son identifiant de bundle et à son chemin sur le disque. Si l’un de ces éléments change, macOS considère l’application comme nouvelle et peut supprimer ou masquer les invites.

## Exigences pour des autorisations stables

- Même chemin : exécutez l’application depuis un emplacement fixe (pour OpenClaw, `dist/OpenClaw.app`).
- Même identifiant de bundle : l’identifiant de bundle d’OpenClaw est `ai.openclaw.mac` ; le modifier crée une nouvelle identité d’autorisation.
- Application signée : les versions non signées ou signées de manière ad hoc ne conservent pas les autorisations.
- Signature cohérente : utilisez un véritable certificat Apple Development ou Developer ID afin que la signature reste stable entre les recompilations.

Les signatures ad hoc génèrent une nouvelle identité à chaque compilation. macOS oublie les autorisations précédentes et les invites peuvent disparaître complètement jusqu’à ce que les entrées obsolètes soient effacées.

## Autorisations d’accessibilité pour les environnements d’exécution Node et CLI

Préférez accorder l’autorisation d’accessibilité à OpenClaw.app, Peekaboo.app ou à un autre utilitaire signé possédant son propre identifiant de bundle plutôt qu’à un binaire `node` générique.

Le système TCC de macOS accorde l’autorisation d’accessibilité à l’identité de code du processus qu’il détecte. Si un processus utilisant Homebrew, nvm, pnpm ou npm conduit à accorder l’autorisation d’accessibilité à un exécutable `node` partagé, tout paquet JavaScript lancé par ce même exécutable peut hériter des privilèges d’automatisation de l’interface graphique.

Considérez une entrée `node` dans System Settings comme une autorisation étendue accordée à cet environnement d’exécution Node, et non comme une autorisation accordée à un seul paquet npm. Évitez d’accorder l’autorisation d’accessibilité à `node`, sauf si vous faites confiance à tous les scripts et paquets lancés par cette installation précise de Node.

Si vous avez accidentellement accordé l’autorisation d’accessibilité à `node`, supprimez cette entrée dans System Settings -> Privacy & Security -> Accessibility. Accordez ensuite l’autorisation à l’application ou à l’utilitaire signé qui doit prendre en charge l’automatisation de l’interface utilisateur.

## Liste de vérification pour la récupération lorsque les invites disparaissent

1. Quittez l’application.
2. Supprimez l’entrée de l’application dans System Settings -> Privacy & Security.
3. Relancez l’application depuis le même chemin et accordez à nouveau les autorisations.
4. Si l’invite n’apparaît toujours pas, réinitialisez les entrées TCC avec `tccutil`, puis réessayez.
5. Certaines autorisations ne réapparaissent qu’après un redémarrage complet de macOS.

Exemples de réinitialisation (avec l’identifiant de bundle d’OpenClaw, `ai.openclaw.mac`) :

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Autorisations relatives aux fichiers et dossiers (Desktop/Documents/Downloads)

macOS peut également restreindre l’accès aux dossiers Desktop, Documents et Downloads pour les processus exécutés dans un terminal ou en arrière-plan. Si la lecture de fichiers ou l’affichage du contenu de répertoires se bloque, accordez l’accès au même contexte de processus que celui qui effectue les opérations sur les fichiers (par exemple Terminal/iTerm, une application lancée par LaunchAgent ou un processus SSH).

Solution de contournement : déplacez les fichiers dans l’espace de travail OpenClaw (`~/.openclaw/workspace`) si vous souhaitez éviter d’accorder des autorisations dossier par dossier.

Si vous testez les autorisations, signez toujours avec un véritable certificat. Les versions signées de manière ad hoc ne sont acceptables que pour de rapides exécutions locales où les autorisations n’ont pas d’importance.

## Pages connexes

- [Application macOS](/fr/platforms/macos)
- [Signature sous macOS](/fr/platforms/mac/signing)
