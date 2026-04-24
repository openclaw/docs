---
read_when:
    - Pareando ou reconectando o node Android
    - Depurando descoberta ou autenticação do gateway no Android
    - Verificando paridade do histórico de chat entre clientes
summary: 'Aplicativo Android (node): runbook de conexão + superfície de comandos Connect/Chat/Voice/Canvas'
title: Aplicativo Android
x-i18n:
    generated_at: "2026-04-24T06:00:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Observação:** O aplicativo Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório OpenClaw](https://github.com/openclaw/openclaw) em `apps/android`. Você pode compilá-lo por conta própria usando Java 17 e o Android SDK (`./gradlew :app:assemblePlayDebug`). Consulte [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para instruções de compilação.

## Resumo de suporte

- Papel: aplicativo complementar de node (o Android não hospeda o Gateway).
- Gateway obrigatório: sim (execute-o em macOS, Linux ou Windows via WSL2).
- Instalação: [Primeiros passos](/pt-BR/start/getting-started) + [Pareamento](/pt-BR/channels/pairing).
- Gateway: [Runbook](/pt-BR/gateway) + [Configuração](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (nodes + plano de controle).

## Controle do sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/pt-BR/gateway).

## Runbook de conexão

Aplicativo Android node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao WebSocket do Gateway e usa pareamento de dispositivo (`role: node`).

Para Tailscale ou hosts públicos, o Android exige um endpoint seguro:

- Preferencial: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outra URL `wss://` do Gateway com um endpoint TLS real
- `ws://` em texto simples continua compatível em endereços privados de LAN / hosts `.local`, além de `localhost`, `127.0.0.1` e a bridge do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Você consegue executar o Gateway na máquina “mestra”.
- O dispositivo/emulador Android consegue alcançar o WebSocket do gateway:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesma tailnet do Tailscale usando Wide-Area Bonjour / unicast DNS-SD (veja abaixo), **ou**
  - Host/porta manual do gateway (fallback)
- O pareamento móvel por tailnet/público **não** usa endpoints brutos `ws://` de IP tailnet. Use Tailscale Serve ou outra URL `wss://`.
- Você consegue executar a CLI (`openclaw`) na máquina do gateway (ou via SSH).

### 1) Inicie o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso remoto por Android via Tailscale, prefira Serve/Funnel em vez de um bind tailnet bruto:

```bash
openclaw gateway --tailscale serve
```

Isso fornece ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples com `gateway.bind: "tailnet"` não é suficiente para o primeiro pareamento remoto do Android, a menos que você também faça terminação TLS separadamente.

### 2) Verifique a descoberta (opcional)

Na máquina do gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais observações de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta wide-area, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` mais o domínio wide-area configurado em uma única passagem e usa o endpoint de serviço resolvido em vez de dicas apenas de TXT.

#### Descoberta via tailnet (Viena ⇄ Londres) com unicast DNS-SD

A descoberta Android por NSD/mDNS não atravessa redes. Se seu node Android e o gateway estiverem em redes diferentes, mas conectados via Tailscale, use Wide-Area Bonjour / unicast DNS-SD.

A descoberta sozinha não é suficiente para o pareamento Android por tailnet/público. A rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do gateway e publique registros `_openclaw-gw._tcp`.
2. Configure DNS dividido do Tailscale para o domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3) Conecte a partir do Android

No aplicativo Android:

- O aplicativo mantém a conexão com o gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Connect**.
- Use o modo **Setup Code** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual em **Advanced controls**. Para hosts privados de LAN, `ws://` ainda funciona. Para hosts Tailscale/públicos, ative TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro pareamento bem-sucedido, o Android se reconecta automaticamente ao iniciar:

- Endpoint manual (se ativado), caso contrário
- O último gateway descoberto (melhor esforço).

### 4) Aprove o pareamento (CLI)

Na máquina do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes de pareamento: [Pareamento](/pt-BR/channels/pairing).

### 5) Verifique se o node está conectado

- Via status dos nodes:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android oferece suporte à seleção de sessão (padrão `main`, mais outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição; tags de diretiva inline são removidas do texto visível, payloads XML de chamada de ferramenta em texto simples (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos truncados de chamada de ferramenta) e tokens de controle de modelo vazados em ASCII/largura total
  são removidos, linhas puras do assistente com token silencioso como `NO_REPLY` /
  `no_reply` exatos são omitidas, e linhas grandes demais podem ser substituídas por placeholders)
- Envio: `chat.send`
- Atualizações push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Canvas Host do Gateway (recomendado para conteúdo web)

Se você quiser que o node mostre HTML/CSS/JS reais que o agente possa editar em disco, aponte o node para o canvas host do Gateway.

Observação: nodes carregam o canvas do servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do gateway.

2. Navegue o node até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP tailnet em vez de `.local`, por exemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de recarga ao vivo no HTML e recarrega em alterações de arquivo.
O host A2UI fica em `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos Canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`)

Comandos de câmera (somente em primeiro plano; controlados por permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Node de câmera](/pt-BR/nodes/camera) para parâmetros e auxiliares de CLI.

### 8) Voz + superfície expandida de comandos do Android

- Voz: o Android usa um único fluxo de ligar/desligar microfone na aba Voice com captura de transcrição e reprodução `talk.speak`. TTS local do sistema é usado apenas quando `talk.speak` não está disponível. A voz para quando o aplicativo sai do primeiro plano.
- Alternâncias de ativação por voz/modo de fala estão atualmente removidas da UX/runtime do Android.
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

O Android oferece suporte a iniciar o OpenClaw a partir do gatilho do assistente do sistema (Google
Assistant). Quando configurado, manter o botão home pressionado ou dizer "Hey Google, ask
OpenClaw..." abre o aplicativo e passa o prompt para o composer do chat.

Isso usa metadados de **App Actions** do Android declarados no manifesto do app. Nenhuma
configuração extra é necessária no lado do gateway -- a intent do assistente é
tratada inteiramente pelo aplicativo Android e encaminhada como uma mensagem normal de chat.

<Note>
A disponibilidade de App Actions depende do dispositivo, da versão do Google Play Services
e de o usuário ter definido o OpenClaw como aplicativo assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo para o gateway como eventos. Vários controles permitem definir o escopo de quais notificações são encaminhadas e quando.

| Key                              | Type           | Descrição                                                                                         |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Encaminha notificações apenas desses nomes de pacote. Se definido, todos os outros pacotes são ignorados. |
| `notifications.denyPackages`     | string[]       | Nunca encaminha notificações desses nomes de pacote. Aplicado após `allowPackages`.              |
| `notifications.quietHours.start` | string (HH:mm) | Início da janela de horas silenciosas (hora local do dispositivo). Notificações são suprimidas durante essa janela. |
| `notifications.quietHours.end`   | string (HH:mm) | Fim da janela de horas silenciosas.                                                               |
| `notifications.rateLimit`        | number         | Máximo de notificações encaminhadas por pacote por minuto. Notificações em excesso são descartadas. |

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
O encaminhamento de notificações exige a permissão Android Notification Listener. O aplicativo solicita isso durante a configuração.
</Note>

## Relacionado

- [Aplicativo iOS](/pt-BR/platforms/ios)
- [Nodes](/pt-BR/nodes)
- [Solução de problemas do node Android](/pt-BR/nodes/troubleshooting)
