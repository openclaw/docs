---
read_when:
    - Emparelhando ou reconectando o Node Android
    - Depurando descoberta ou autenticação do Gateway no Android
    - Verificando paridade do histórico de chat entre clientes
summary: 'App Android (Node): runbook de conexão + superfície de comando Connect/Chat/Voice/Canvas'
title: App Android
x-i18n:
    generated_at: "2026-04-25T13:50:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **Observação:** O app Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório OpenClaw](https://github.com/openclaw/openclaw) em `apps/android`. Você pode compilá-lo por conta própria usando Java 17 e o Android SDK (`./gradlew :app:assemblePlayDebug`). Consulte [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para instruções de compilação.

## Resumo de suporte

- Função: app complementar de Node (o Android não hospeda o Gateway).
- Gateway necessário: sim (execute-o no macOS, Linux ou Windows via WSL2).
- Instalação: [Primeiros passos](/pt-BR/start/getting-started) + [Emparelhamento](/pt-BR/channels/pairing).
- Gateway: [Runbook](/pt-BR/gateway) + [Configuration](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (Nodes + plano de controle).

## Controle do sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/pt-BR/gateway).

## Runbook de conexão

App Android de Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao Gateway WebSocket e usa emparelhamento de dispositivo (`role: node`).

Para Tailscale ou hosts públicos, o Android exige um endpoint seguro:

- Preferido: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outra URL `wss://` do Gateway com um endpoint TLS real
- `ws://` em texto simples continua compatível em endereços privados de LAN / hosts `.local`, além de `localhost`, `127.0.0.1` e da ponte do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Você consegue executar o Gateway na máquina “principal”.
- O dispositivo/emulador Android consegue alcançar o Gateway WebSocket:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesma tailnet do Tailscale usando Wide-Area Bonjour / unicast DNS-SD (veja abaixo), **ou**
  - Host/porta do Gateway manualmente (fallback)
- O emparelhamento móvel por tailnet/público **não** usa endpoints brutos `ws://` de IP da tailnet. Use Tailscale Serve ou outra URL `wss://`.
- Você consegue executar a CLI (`openclaw`) na máquina do Gateway (ou via SSH).

### 1) Inicie o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso remoto do Android via Tailscale, prefira Serve/Funnel em vez de um bind bruto de tailnet:

```bash
openclaw gateway --tailscale serve
```

Isso fornece ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples com `gateway.bind: "tailnet"` não é suficiente para o primeiro emparelhamento remoto do Android, a menos que você também finalize TLS separadamente.

### 2) Verifique a descoberta (opcional)

Na máquina do Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais observações de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta wide-area, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` mais o domínio wide-area configurado em uma única passada e usa o endpoint de serviço resolvido em vez de dicas apenas de TXT.

#### Descoberta por tailnet (Viena ⇄ Londres) via unicast DNS-SD

A descoberta Android por NSD/mDNS não atravessa redes. Se seu Node Android e o Gateway estiverem em redes diferentes, mas conectados via Tailscale, use Wide-Area Bonjour / unicast DNS-SD.

A descoberta por si só não é suficiente para o emparelhamento do Android por tailnet/público. A rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do Gateway e publique registros `_openclaw-gw._tcp`.
2. Configure DNS dividido do Tailscale para o domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3) Conecte-se pelo Android

No app Android:

- O app mantém a conexão com o Gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Connect**.
- Use o modo **Setup Code** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual em **Advanced controls**. Para hosts privados de LAN, `ws://` ainda funciona. Para hosts Tailscale/públicos, ative TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro emparelhamento bem-sucedido, o Android se reconecta automaticamente na inicialização:

- Endpoint manual (se ativado), caso contrário
- O último Gateway descoberto (melhor esforço).

### 4) Aprove o emparelhamento (CLI)

Na máquina do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes do emparelhamento: [Emparelhamento](/pt-BR/channels/pairing).

Opcional: se o Node Android sempre se conectar a partir de uma sub-rede rigidamente controlada,
você pode ativar a aprovação automática do primeiro emparelhamento de Node com CIDRs explícitos ou IPs exatos:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Isso vem desabilitado por padrão. Aplica-se apenas ao emparelhamento novo de `role: node` sem escopos solicitados. Emparelhamento de operator/browser e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

### 5) Verifique se o Node está conectado

- Via status dos Nodes:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android oferece suporte à seleção de sessão (padrão `main`, além de outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição; tags de diretiva inline são
  removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle de modelo vazados em ASCII/largura total
  são removidos, linhas puras de assistente com token silencioso como `NO_REPLY` /
  `no_reply` exatos são omitidas, e linhas grandes demais podem ser substituídas por placeholders)
- Enviar: `chat.send`
- Atualizações push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Host de Canvas do Gateway (recomendado para conteúdo web)

Se você quiser que o Node mostre HTML/CSS/JS real que o agente possa editar em disco, aponte o Node para o host de canvas do Gateway.

Observação: Nodes carregam o canvas do servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do Gateway.

2. Navegue o Node até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP de tailnet em vez de `.local`, por exemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de live reload no HTML e recarrega em alterações de arquivo.
O host A2UI fica em `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (o padrão de `format` é `"jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`)

Comandos de câmera (somente em primeiro plano; controlados por permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Node de câmera](/pt-BR/nodes/camera) para parâmetros e helpers da CLI.

### 8) Voz + superfície expandida de comando do Android

- Voz: o Android usa um único fluxo de ligar/desligar o microfone na aba Voice com captura de transcrição e reprodução `talk.speak`. O TTS local do sistema é usado apenas quando `talk.speak` não está disponível. A voz para quando o app sai do primeiro plano.
- Alternâncias de ativação por voz/modo Talk estão atualmente removidas da UX/runtime do Android.
- Famílias adicionais de comandos do Android (a disponibilidade depende do dispositivo + permissões):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulte [Encaminhamento de notificações](#notification-forwarding) abaixo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Pontos de entrada do assistente

O Android oferece suporte a iniciar o OpenClaw pelo gatilho do assistente do sistema (Google
Assistant). Quando configurado, manter pressionado o botão home ou dizer "Hey Google, ask
OpenClaw..." abre o app e envia o prompt para o compositor de chat.

Isso usa metadados de **App Actions** do Android declarados no manifesto do app. Nenhuma
configuração extra é necessária no lado do Gateway -- o intent do assistente é tratado inteiramente pelo app Android e encaminhado como uma mensagem de chat normal.

<Note>
A disponibilidade de App Actions depende do dispositivo, da versão do Google Play Services
e de o usuário ter definido o OpenClaw como app assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo para o Gateway como eventos. Vários controles permitem delimitar quais notificações são encaminhadas e quando.

| Chave                            | Tipo           | Descrição                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Encaminha apenas notificações desses nomes de pacote. Se definido, todos os outros pacotes são ignorados. |
| `notifications.denyPackages`     | string[]       | Nunca encaminha notificações desses nomes de pacote. Aplicado após `allowPackages`.               |
| `notifications.quietHours.start` | string (HH:mm) | Início da janela de horas silenciosas (hora local do dispositivo). As notificações são suprimidas durante essa janela. |
| `notifications.quietHours.end`   | string (HH:mm) | Fim da janela de horas silenciosas.                                                               |
| `notifications.rateLimit`        | number         | Número máximo de notificações encaminhadas por pacote por minuto. Notificações excedentes são descartadas. |

O seletor de notificações também usa um comportamento mais seguro para eventos de notificação encaminhados, evitando o encaminhamento acidental de notificações sensíveis do sistema.

Exemplo de configuração:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
O encaminhamento de notificações exige a permissão Android Notification Listener. O app solicita isso durante a configuração.
</Note>

## Relacionado

- [App iOS](/pt-BR/platforms/ios)
- [Nodes](/pt-BR/nodes)
- [Solução de problemas do Node Android](/pt-BR/nodes/troubleshooting)
