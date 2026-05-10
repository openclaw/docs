---
read_when:
    - Node está conectado, mas as ferramentas camera/canvas/screen/exec falham
    - Você precisa do modelo mental de pareamento de Node versus aprovações
summary: Solucionar problemas de pareamento de Node, requisitos de primeiro plano, permissões e falhas de ferramentas
title: Solução de problemas do Node
x-i18n:
    generated_at: "2026-05-10T19:39:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
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

Depois execute verificações específicas do Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Sinais saudáveis:

- O Node está conectado e pareado para a função `node`.
- `nodes describe` inclui a capacidade que você está chamando.
- As aprovações de execução mostram o modo/lista de permissões esperado.

## Requisitos de primeiro plano

`canvas.*`, `camera.*` e `screen.*` funcionam apenas em primeiro plano em Nodes iOS/Android.

Verificação e correção rápidas:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Se você vir `NODE_BACKGROUND_UNAVAILABLE`, coloque o app do Node em primeiro plano e tente novamente.

## Matriz de permissões

| Capacidade                   | iOS                                            | Android                                             | app de Node no macOS               | Código de falha típico          |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------- | ---------------------------------- | ------------------------------- |
| `camera.snap`, `camera.clip` | Câmera (+ microfone para áudio do clipe)       | Câmera (+ microfone para áudio do clipe)            | Câmera (+ microfone para áudio do clipe) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Gravação de Tela (+ microfone opcional)        | Prompt de captura de tela (+ microfone opcional)    | Gravação de Tela                   | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Durante o Uso ou Sempre (depende do modo)      | Localização em primeiro plano/segundo plano com base no modo | Permissão de localização           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a (caminho do host do Node)                  | n/a (caminho do host do Node)                       | Aprovações de execução necessárias | `SYSTEM_RUN_DENIED`            |

## Pareamento versus aprovações

Estes são controles diferentes:

1. **Pareamento de dispositivo**: este Node pode se conectar ao Gateway?
2. **Política de comandos de Node do Gateway**: o ID do comando RPC é permitido por `gateway.nodes.allowCommands` / `denyCommands` e pelos padrões da plataforma?
3. **Aprovações de execução**: este Node pode executar um comando de shell específico localmente?

Verificações rápidas:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Se o pareamento estiver ausente, aprove primeiro o dispositivo Node.
Se `nodes describe` estiver sem um comando, verifique a política de comandos de Node do Gateway e se o Node realmente declarou esse comando ao se conectar.
Se o pareamento estiver correto, mas `system.run` falhar, corrija as aprovações/lista de permissões de execução nesse Node.

O pareamento de Node é um controle de identidade/confiança, não uma superfície de aprovação por comando. Para `system.run`, a política por Node fica no arquivo de aprovações de execução desse Node (`openclaw approvals get --node ...`), não no registro de pareamento do Gateway.

Para execuções `host=node` com base em aprovação, o Gateway também vincula a execução ao
`systemRunPlan` canônico preparado. Se um chamador posterior alterar o comando/cwd ou
metadados de sessão antes que a execução aprovada seja encaminhada, o Gateway rejeita a
execução como incompatibilidade de aprovação em vez de confiar no payload editado.

## Códigos de erro comuns de Node

- `NODE_BACKGROUND_UNAVAILABLE` → o app está em segundo plano; coloque-o em primeiro plano.
- `CAMERA_DISABLED` → alternância da câmera desativada nas configurações do Node.
- `*_PERMISSION_REQUIRED` → permissão do SO ausente/negada.
- `LOCATION_DISABLED` → modo de localização desativado.
- `LOCATION_PERMISSION_REQUIRED` → modo de localização solicitado não concedido.
- `LOCATION_BACKGROUND_UNAVAILABLE` → o app está em segundo plano, mas só existe permissão Durante o Uso.
- `SYSTEM_RUN_DENIED: approval required` → a solicitação de execução precisa de aprovação explícita.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado pelo modo de lista de permissões.
  Em hosts de Node Windows, formas de wrapper de shell como `cmd.exe /c ...` são tratadas como ausências na lista de permissões no
  modo de lista de permissões, a menos que sejam aprovadas pelo fluxo de solicitação.

## Ciclo rápido de recuperação

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Se ainda estiver travado:

- Aprove novamente o pareamento do dispositivo.
- Reabra o app do Node (primeiro plano).
- Conceda novamente as permissões do SO.
- Recrie/ajuste a política de aprovação de execução.

## Relacionados

- [Visão geral de Nodes](/pt-BR/nodes)
- [Nodes de câmera](/pt-BR/nodes/camera)
- [Comando de localização](/pt-BR/nodes/location-command)
- [Aprovações de execução](/pt-BR/tools/exec-approvals)
- [Pareamento do Gateway](/pt-BR/gateway/pairing)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Solução de problemas de canais](/pt-BR/channels/troubleshooting)
