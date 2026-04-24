---
read_when:
    - O Node está conectado, mas as ferramentas de camera/canvas/screen/exec falham
    - Você precisa do modelo mental de pareamento de Node versus aprovações
summary: Solução de problemas de pareamento de Node, requisitos de primeiro plano, permissões e falhas de ferramenta
title: Solução de problemas de Node
x-i18n:
    generated_at: "2026-04-24T05:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Use esta página quando um Node estiver visível no status, mas as ferramentas de Node falharem.

## Sequência de comandos

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Depois execute verificações específicas de Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sinais saudáveis:

- O Node está conectado e pareado para o papel `node`.
- `nodes describe` inclui a capacidade que você está chamando.
- As aprovações de exec mostram o modo/allowlist esperado.

## Requisitos de primeiro plano

`canvas.*`, `camera.*` e `screen.*` funcionam apenas em primeiro plano em Nodes iOS/Android.

Verificação e correção rápida:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se você vir `NODE_BACKGROUND_UNAVAILABLE`, traga o app do Node para o primeiro plano e tente novamente.

## Matriz de permissões

| Capacidade                   | iOS                                     | Android                                     | app Node do macOS            | Código de falha típico         |
| ---------------------------- | --------------------------------------- | ------------------------------------------- | ---------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Câmera (+ microfone para áudio do clip) | Câmera (+ microfone para áudio do clip)     | Câmera (+ microfone para áudio do clip) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Gravação de tela (+ microfone opcional) | Prompt de captura de tela (+ microfone opcional) | Gravação de tela             | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Durante o uso ou sempre (depende do modo) | Localização em primeiro/segundo plano com base no modo | Permissão de localização     | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (caminho do host Node)              | n/a (caminho do host Node)                  | Aprovações de exec exigidas  | `SYSTEM_RUN_DENIED`            |

## Pareamento versus aprovações

Esses são controles diferentes:

1. **Pareamento de dispositivo**: este Node pode se conectar ao gateway?
2. **Política de comando de Node do Gateway**: o ID de comando RPC é permitido por `gateway.nodes.allowCommands` / `denyCommands` e pelos padrões da plataforma?
3. **Aprovações de exec**: este Node pode executar localmente um comando específico de shell?

Verificações rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se o pareamento estiver ausente, aprove primeiro o dispositivo do Node.
Se `nodes describe` não tiver um comando, verifique a política de comando de Node do gateway e se o Node realmente declarou esse comando em `connect`.
Se o pareamento estiver correto, mas `system.run` falhar, corrija as aprovações/allowlist de exec nesse Node.

O pareamento de Node é um controle de identidade/confiança, não uma superfície de aprovação por comando. Para `system.run`, a política por Node vive no arquivo de aprovações de exec desse Node (`openclaw approvals get --node ...`), não no registro de pareamento do gateway.

Para execuções `host=node` com suporte de aprovação, o gateway também vincula a execução ao `systemRunPlan`
canônico preparado. Se um chamador posterior alterar comando/cwd ou
metadados de sessão antes que a execução aprovada seja encaminhada, o gateway rejeita a
execução como incompatibilidade de aprovação, em vez de confiar na carga útil editada.

## Códigos comuns de erro de Node

- `NODE_BACKGROUND_UNAVAILABLE` → o app está em segundo plano; traga-o para o primeiro plano.
- `CAMERA_DISABLED` → a opção da câmera está desativada nas configurações do Node.
- `*_PERMISSION_REQUIRED` → permissão do SO ausente/negada.
- `LOCATION_DISABLED` → o modo de localização está desativado.
- `LOCATION_PERMISSION_REQUIRED` → o modo de localização solicitado não foi concedido.
- `LOCATION_BACKGROUND_UNAVAILABLE` → o app está em segundo plano, mas existe apenas permissão Durante o uso.
- `SYSTEM_RUN_DENIED: approval required` → a requisição de exec precisa de aprovação explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pelo modo allowlist.
  Em hosts Node Windows, formas de wrapper de shell como `cmd.exe /c ...` são tratadas como allowlist miss em
  modo allowlist, a menos que sejam aprovadas via fluxo ask.

## Loop rápido de recuperação

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se ainda estiver travado:

- Reaprove o pareamento do dispositivo.
- Reabra o app do Node (primeiro plano).
- Conceda novamente as permissões do SO.
- Recrie/ajuste a política de aprovação de exec.

Relacionado:

- [/nodes/index](/pt-BR/nodes/index)
- [/nodes/camera](/pt-BR/nodes/camera)
- [/nodes/location-command](/pt-BR/nodes/location-command)
- [/tools/exec-approvals](/pt-BR/tools/exec-approvals)
- [/gateway/pairing](/pt-BR/gateway/pairing)

## Relacionado

- [Visão geral dos Nodes](/pt-BR/nodes)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Solução de problemas de canal](/pt-BR/channels/troubleshooting)
