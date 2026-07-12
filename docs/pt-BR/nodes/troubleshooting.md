---
read_when:
    - O Node está conectado, mas as ferramentas de câmera/canvas/tela/exec falham
    - Você precisa entender o modelo mental de pareamento de nós em comparação com aprovações
summary: Solucione problemas de pareamento de Nodes, requisitos de execução em primeiro plano, permissões e falhas de ferramentas
title: Solução de problemas do Node
x-i18n:
    generated_at: "2026-07-12T00:06:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

Use esta página quando um Node estiver visível no status, mas as ferramentas do Node falharem.

## Sequência de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Em seguida, execute verificações específicas do Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sinais de funcionamento normal:

- O Node está conectado e pareado para a função `node`.
- `nodes describe` inclui o recurso que você está chamando.
- As aprovações de execução mostram o modo e a lista de permissões esperados.

## Requisitos de primeiro plano

`canvas.*`, `camera.*` e `screen.*` funcionam somente em primeiro plano em Nodes iOS/Android.

Verificação e correção rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se você vir `NODE_BACKGROUND_UNAVAILABLE`, coloque o aplicativo do Node em primeiro plano e tente novamente.

## Matriz de permissões

| Recurso                      | iOS                                            | Android                                               | Aplicativo do Node para macOS          | Código de falha comum                         |
| ---------------------------- | ---------------------------------------------- | ----------------------------------------------------- | --------------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | Câmera (+ microfone para o áudio do clipe)     | Câmera (+ microfone para o áudio do clipe)            | Câmera (+ microfone para o áudio do clipe) | `*_PERMISSION_REQUIRED`                    |
| `screen.record`              | Gravação de Tela (+ microfone opcional)        | Solicitação de captura de tela (+ microfone opcional) | Gravação de Tela                        | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | não aplicável                                  | não aplicável                                         | Acessibilidade + Gravação de Tela       | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | Durante o Uso ou Sempre (depende do modo)      | Localização em primeiro/segundo plano conforme o modo | Permissão de localização                | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | não aplicável (caminho do host do Node)        | não aplicável (caminho do host do Node)               | Aprovações de execução obrigatórias     | `SYSTEM_RUN_DENIED`                           |

## Pareamento versus aprovações

Três controles separados determinam se um comando do Node é bem-sucedido:

1. **Pareamento do dispositivo**: este Node pode se conectar ao Gateway?
2. **Política de comandos de Node do Gateway**: o ID do comando RPC é permitido por `gateway.nodes.allowCommands` / `denyCommands` e pelos padrões da plataforma?
3. **Aprovações de execução**: este Node pode executar localmente um comando de shell específico?

O pareamento do Node é um controle de identidade/confiança, não uma superfície de aprovação por comando. Para `system.run`, a política por Node fica no arquivo de aprovações de execução desse Node (`openclaw approvals get --node ...`), e não no registro de pareamento do Gateway.

Verificações rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- Pareamento ausente: primeiro aprove o dispositivo do Node.
- Um comando não aparece em `nodes describe`: verifique a política de comandos de Node do Gateway e se o Node realmente declarou esse comando ao se conectar.
- O pareamento está correto, mas `system.run` falha: corrija as aprovações de execução/lista de permissões nesse Node.

Para execuções `host=node` respaldadas por aprovação, o Gateway também vincula a execução ao `systemRunPlan` canônico preparado. Se um chamador posterior modificar o comando, o diretório de trabalho ou os metadados da sessão antes que a execução aprovada seja encaminhada, o Gateway rejeitará a execução devido a uma incompatibilidade de aprovação, em vez de confiar na carga útil editada.

## Códigos de erro comuns de Node

| Código                                 | Significado                                                                                                                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | O aplicativo está em segundo plano; coloque-o em primeiro plano.                                                                                                                                     |
| `CAMERA_DISABLED`                      | A opção da câmera está desativada nas configurações do Node.                                                                                                                                         |
| `*_PERMISSION_REQUIRED`                | A permissão do sistema operacional está ausente ou foi negada.                                                                                                                                       |
| `LOCATION_DISABLED`                    | O modo de localização está desativado.                                                                                                                                                               |
| `LOCATION_PERMISSION_REQUIRED`         | O modo de localização solicitado não foi concedido.                                                                                                                                                  |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | O aplicativo está em segundo plano, mas existe apenas a permissão Durante o Uso.                                                                                                                      |
| `COMPUTER_DISABLED`                    | Ative **Allow Computer Control** no aplicativo para macOS e aprove a atualização do pareamento.                                                                                                      |
| `ACCESSIBILITY_REQUIRED`               | Conceda Acessibilidade ao pacote atual do aplicativo OpenClaw nos Ajustes do Sistema do macOS.                                                                                                        |
| `SYSTEM_RUN_DENIED: approval required` | A solicitação de execução precisa de aprovação explícita.                                                                                                                                            |
| `SYSTEM_RUN_DENIED: allowlist miss`    | O comando foi bloqueado pelo modo de lista de permissões. Em hosts de Node Windows, formatos com wrappers de shell, como `cmd.exe /c ...`, são tratados como ausentes da lista de permissões nesse modo, a menos que sejam aprovados pelo fluxo de solicitação. |

## Ciclo de recuperação rápida

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se o problema persistir:

- Aprove novamente o pareamento do dispositivo.
- Abra novamente o aplicativo do Node (em primeiro plano).
- Conceda novamente as permissões do sistema operacional.
- Recrie ou ajuste a política de aprovação de execução.

Para o controle do computador, verifique também se um agente com capacidade de visão disponibiliza a ferramenta `computer`, se `screen.snapshot` é bem-sucedido com a permissão de Gravação de Tela e se `/phone status` mostra a autorização temporária ou persistente do Gateway que você pretendia usar. Uma entrada em `gateway.nodes.denyCommands` sempre prevalece sobre `allowCommands`.

## Conteúdo relacionado

- [Visão geral dos Nodes](/pt-BR/nodes)
- [Nodes de câmera](/pt-BR/nodes/camera)
- [Comando de localização](/pt-BR/nodes/location-command)
- [Uso do computador](/pt-BR/nodes/computer-use)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Pareamento do Gateway](/pt-BR/gateway/pairing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
