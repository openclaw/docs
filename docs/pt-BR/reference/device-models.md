---
read_when:
    - Atualização dos mapeamentos de identificadores de modelos de dispositivos ou dos arquivos NOTICE/licença
    - Alteração de como a interface de Instâncias exibe os nomes dos dispositivos
summary: Como o OpenClaw incorpora identificadores de modelos de dispositivos Apple para exibir nomes amigáveis no aplicativo para macOS.
title: Banco de dados de modelos de dispositivos
x-i18n:
    generated_at: "2026-07-12T15:35:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

A interface de **Instâncias** do aplicativo complementar para macOS mapeia identificadores de modelos da Apple para nomes amigáveis (`iPad16,6` -> "iPad Pro de 13 polegadas (M4)", `Mac16,6` -> "MacBook Pro (14 polegadas, 2024)"). `DeviceModelCatalog` também usa o prefixo do identificador (recorrendo à família do dispositivo como alternativa) para escolher um símbolo SF para cada dispositivo.

Arquivos em `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`:

| Arquivo                                | Finalidade                                      |
| -------------------------------------- | ----------------------------------------------- |
| `ios-device-identifiers.json`          | Mapeamento de identificador iOS/iPadOS -> nome  |
| `mac-device-identifiers.json`          | Mapeamento de identificador Mac -> nome         |
| `NOTICE.md`                            | SHAs fixados dos commits do repositório original |
| `LICENSE.apple-device-identifiers.txt` | Licença MIT do repositório original             |

## Fonte dos dados

Importados do repositório do GitHub `kyle-seongwoo-jun/apple-device-identifiers`, licenciado sob a licença MIT. Os arquivos JSON são fixados nos SHAs dos commits registrados em `NOTICE.md` para manter as compilações determinísticas.

## Atualização do banco de dados

1. Escolha os SHAs dos commits do repositório original que serão fixados (um para iOS e outro para macOS).
2. Atualize `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` com os novos SHAs.
3. Baixe novamente os arquivos JSON fixados nesses commits:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. Confirme se `LICENSE.apple-device-identifiers.txt` ainda corresponde à versão do repositório original; substitua-o se a licença original tiver sido alterada.
5. Verifique se o aplicativo para macOS é compilado sem erros:

```bash
swift build --package-path apps/macos
```

## Relacionado

- [Nodes](/pt-BR/nodes)
- [Solução de problemas de Node](/pt-BR/nodes/troubleshooting)
