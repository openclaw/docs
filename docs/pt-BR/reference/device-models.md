---
read_when:
    - Atualizando mapeamentos de identificadores de modelo de dispositivo ou arquivos NOTICE/license
    - Alterando como a UI de Instâncias exibe nomes de dispositivos
summary: Como o OpenClaw incorpora identificadores de modelo de dispositivos Apple para nomes amigáveis no app macOS.
title: Banco de dados de modelos de dispositivos
x-i18n:
    generated_at: "2026-04-25T13:55:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 15
---

O app complementar para macOS mostra nomes amigáveis de modelos de dispositivos Apple na UI de **Instâncias** mapeando identificadores de modelo da Apple (por exemplo, `iPad16,6`, `Mac16,6`) para nomes legíveis por humanos.

O mapeamento é incorporado como JSON em:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Fonte de dados

Atualmente incorporamos o mapeamento do repositório sob licença MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para manter builds determinísticos, os arquivos JSON são fixados em commits específicos upstream (registrados em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Atualizando o banco de dados

1. Escolha os commits upstream que você quer fixar (um para iOS, um para macOS).
2. Atualize os hashes de commit em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Baixe novamente os arquivos JSON, fixados nesses commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Garanta que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ainda corresponda ao upstream (substitua-o se a licença upstream mudar).
5. Verifique se o app macOS compila sem problemas (sem avisos):

```bash
swift build --package-path apps/macos
```

## Relacionado

- [Nodes](/pt-BR/nodes)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
