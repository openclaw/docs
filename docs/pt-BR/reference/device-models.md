---
read_when:
    - Atualizando mapeamentos de identificadores de modelo de dispositivo ou arquivos NOTICE/licença
    - Alterando como a UI de Instâncias exibe nomes de dispositivos
summary: Como o OpenClaw mantém em vendor identificadores de modelos de dispositivos Apple para nomes amigáveis no app do macOS.
title: Banco de dados de modelos de dispositivos
x-i18n:
    generated_at: "2026-04-24T06:10:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e892bf439a878b737d2322188acec850aa5bda2e7051ee0481850c921c69facb
    source_path: reference/device-models.md
    workflow: 15
---

# Banco de dados de modelos de dispositivos (nomes amigáveis)

O app complementar do macOS mostra nomes amigáveis de modelos de dispositivos Apple na UI de **Instances** ao mapear identificadores de modelo da Apple (por exemplo `iPad16,6`, `Mac16,6`) para nomes legíveis por humanos.

O mapeamento é mantido em vendor como JSON em:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## Fonte de dados

Atualmente mantemos em vendor o mapeamento do repositório licenciado sob MIT:

- `kyle-seongwoo-jun/apple-device-identifiers`

Para manter builds determinísticos, os arquivos JSON são fixados a commits upstream específicos (registrados em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`).

## Atualizando o banco de dados

1. Escolha os commits upstream que você quer fixar (um para iOS, um para macOS).
2. Atualize os hashes de commit em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`.
3. Baixe novamente os arquivos JSON, fixados nesses commits:

```bash
IOS_COMMIT="<commit sha para ios-device-identifiers.json>"
MAC_COMMIT="<commit sha para mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Garanta que `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` ainda corresponda ao upstream (substitua-o se a licença upstream mudar).
5. Verifique se o app do macOS compila sem problemas (sem warnings):

```bash
swift build --package-path apps/macos
```

## Relacionado

- [Nodes](/pt-BR/nodes)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
