---
read_when:
    - Pareando ou reconectando o nó Android
    - Depurando a descoberta ou autenticação do Gateway Android
    - Verificando a paridade do histórico de chat entre clientes
summary: 'Aplicativo Android (Node): runbook de conexão + superfície de comandos Connect/Chat/Voice/Canvas'
title: Aplicativo Android
x-i18n:
    generated_at: "2026-06-27T17:41:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
O app Android oficial está disponível no [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Ele é um nó complementar e requer um OpenClaw Gateway em execução. O código-fonte também está disponível no [repositório OpenClaw](https://github.com/openclaw/openclaw) em `apps/android`; consulte [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para instruções de build.
</Note>

## Snapshot de suporte

- Função: app de nó complementar (Android não hospeda o Gateway).
- Gateway obrigatório: sim (execute-o no macOS, Linux ou Windows via WSL2).
- Instalação: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) para o app, [Introdução](/pt-BR/start/getting-started) para o Gateway e depois [Pareamento](/pt-BR/channels/pairing).
- Gateway: [Runbook](/pt-BR/gateway) + [Configuração](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (nós + plano de controle).

## Controle do sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/pt-BR/gateway).

## Runbook de conexão

App de nó Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao WebSocket do Gateway e usa pareamento de dispositivo (`role: node`).

Para Tailscale ou hosts públicos, o Android requer um endpoint seguro:

- Preferencial: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outra URL de Gateway `wss://` com um endpoint TLS real
- `ws://` em texto claro continua compatível em endereços de LAN privada / hosts `.local`, além de `localhost`, `127.0.0.1` e a ponte do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Você consegue executar o Gateway na máquina "mestre".
- O dispositivo/emulador Android consegue acessar o WebSocket do gateway:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesma tailnet Tailscale usando Wide-Area Bonjour / DNS-SD unicast (veja abaixo), **ou**
  - Host/porta do gateway manual (fallback)
- O pareamento móvel por tailnet/público **não** usa endpoints IP de tailnet brutos `ws://`. Use Tailscale Serve ou outra URL `wss://`.
- Você consegue executar a CLI (`openclaw`) na máquina do gateway (ou via SSH).

### 1) Inicie o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso Android remoto via Tailscale, prefira Serve/Funnel em vez de vincular diretamente à tailnet:

```bash
openclaw gateway --tailscale serve
```

Isso dá ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples `gateway.bind: "tailnet"` não é suficiente para o primeiro pareamento Android remoto, a menos que você também finalize TLS separadamente.

### 2) Verifique a descoberta (opcional)

Na máquina do gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais notas de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta de área ampla, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` mais o domínio de área ampla configurado em uma só passagem e usa o endpoint de serviço resolvido em vez de dicas somente TXT.

#### Descoberta de tailnet (Viena ⇄ Londres) via DNS-SD unicast

A descoberta NSD/mDNS do Android não atravessa redes. Se o nó Android e o gateway estiverem em redes diferentes, mas conectados via Tailscale, use Wide-Area Bonjour / DNS-SD unicast.

A descoberta sozinha não é suficiente para pareamento Android por tailnet/público. A rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do gateway e publique registros `_openclaw-gw._tcp`.
2. Configure o DNS dividido do Tailscale para o domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3) Conecte pelo Android

No app Android:

- O app mantém sua conexão com o gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Conectar**.
- Use o modo **Código de configuração** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual em **Controles avançados**. Para hosts de LAN privada, `ws://` ainda funciona. Para hosts Tailscale/públicos, ative TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro pareamento bem-sucedido, o Android se reconecta automaticamente ao iniciar:

- Endpoint manual (se habilitado), caso contrário
- O último gateway descoberto (melhor esforço).

### Beacons de presença ativa

Depois que a sessão de nó autenticada se conecta, e quando o app vai para o segundo plano enquanto o serviço em primeiro plano ainda está conectado, o Android chama `node.event` com `event: "node.presence.alive"`. O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do nó/dispositivo pareado somente depois que a identidade autenticada do dispositivo de nó é conhecida.

O app conta o beacon como registrado com sucesso somente quando a resposta do gateway inclui `handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é compatível, mas não conta como uma atualização durável de último visto.

### 4) Aprove o pareamento (CLI)

Na máquina do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes de pareamento: [Pareamento](/pt-BR/channels/pairing).

Opcional: se o nó Android sempre se conecta a partir de uma sub-rede rigidamente controlada, você pode optar pela aprovação automática de nó no primeiro pareamento com CIDRs explícitos ou IPs exatos:

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

Isso fica desabilitado por padrão. Aplica-se apenas a pareamentos novos com `role: node` sem escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

### 5) Verifique se o nó está conectado

- Via status dos nós:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android oferece suporte à seleção de sessão (padrão `main`, além de outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição; tags de diretivas inline são removidas do texto visível, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos de chamada de ferramenta truncados) e tokens de controle de modelo ASCII/largura completa vazados são removidos, linhas de assistente compostas apenas por token silencioso, como `NO_REPLY` / `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders)
- Envio: `chat.send`
- Atualizações push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Host Canvas do Gateway (recomendado para conteúdo web)

Se você quiser que o nó mostre HTML/CSS/JS real que o agente possa editar em disco, aponte o nó para o host Canvas do Gateway.

<Note>
Os nós carregam o canvas a partir do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
</Note>

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do gateway.

2. Navegue o nó até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP da tailnet em vez de `.local`, por exemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de recarregamento ao vivo no HTML e recarrega quando arquivos mudam. O Gateway também serve `/__openclaw__/a2ui/`, mas o app Android trata páginas A2UI remotas como somente renderização. Comandos A2UI com ações usam a página A2UI empacotada e pertencente ao app antes de aplicar mensagens.

Comandos Canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`). Esses comandos usam a página A2UI empacotada e pertencente ao app para renderização com ações.

Comandos de câmera (somente em primeiro plano; protegidos por permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Nó de câmera](/pt-BR/nodes/camera) para parâmetros e auxiliares de CLI.

### 8) Voz + superfície expandida de comandos Android

- Aba Voz: o Android tem dois modos explícitos de captura. **Microfone** é uma sessão manual da aba Voz que envia cada pausa como uma rodada de chat e para quando o app sai do primeiro plano ou quando o usuário sai da aba Voz. **Falar** é o Modo Falar contínuo e continua ouvindo até ser desativado ou até o nó se desconectar.
- O Modo Falar promove o serviço em primeiro plano existente de `connectedDevice` para `connectedDevice|microphone` antes do início da captura e depois o rebaixa quando o Modo Falar para. O serviço de nó declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` com `CHANGE_NETWORK_STATE`; Android 14+ também exige a declaração `FOREGROUND_SERVICE_MICROPHONE`, a concessão de runtime `RECORD_AUDIO` e o tipo de serviço de microfone em runtime.
- Por padrão, o Falar do Android usa reconhecimento de fala nativo, chat do Gateway e `talk.speak` pelo provedor Falar configurado do gateway. TTS local do sistema é usado somente quando `talk.speak` não está disponível.
- O Falar do Android usa relay em tempo real do Gateway somente quando `talk.realtime.mode` é `realtime` e `talk.realtime.transport` é `gateway-relay`.
- A ativação por voz permanece desabilitada na UX/runtime do Android.
- Famílias adicionais de comandos Android (a disponibilidade depende do dispositivo, permissões e configurações do usuário):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` somente quando **Configurações > Recursos do telefone > Apps instalados** está habilitado; lista apps visíveis no iniciador por padrão.
  - `notifications.list`, `notifications.actions` (consulte [Encaminhamento de notificações](#notification-forwarding) abaixo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Pontos de entrada do assistente

O Android oferece suporte à inicialização do OpenClaw pelo gatilho do assistente do sistema (Google Assistant). Quando configurado, segurar o botão de início ou dizer "Hey Google, ask OpenClaw..." abre o app e entrega o prompt ao compositor de chat.

Isso usa metadados de **App Actions** do Android declarados no manifesto do app. Nenhuma configuração extra é necessária no lado do gateway -- a intenção do assistente é tratada inteiramente pelo app Android e encaminhada como uma mensagem de chat normal.

<Note>
A disponibilidade de App Actions depende do dispositivo, da versão do Google Play Services e de o usuário ter definido o OpenClaw como app de assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo para o gateway como eventos. Vários controles permitem delimitar quais notificações são encaminhadas e quando.

| Chave                            | Tipo           | Descrição                                                                                           |
| -------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Encaminhe somente notificações destes nomes de pacote. Se definido, todos os outros pacotes são ignorados. |
| `notifications.denyPackages`     | string[]       | Nunca encaminhe notificações destes nomes de pacote. Aplicado depois de `allowPackages`.            |
| `notifications.quietHours.start` | string (HH:mm) | Início da janela de horas silenciosas (horário local do dispositivo). Notificações são suprimidas durante essa janela. |
| `notifications.quietHours.end`   | string (HH:mm) | Fim da janela de horas silenciosas.                                                                 |
| `notifications.rateLimit`        | number         | Máximo de notificações encaminhadas por pacote por minuto. Notificações excedentes são descartadas. |

O seletor de notificações também usa comportamento mais seguro para eventos de notificação encaminhados, evitando o encaminhamento acidental de notificações sensíveis do sistema.

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

## Relacionados

- [App iOS](/pt-BR/platforms/ios)
- [Nós](/pt-BR/nodes)
- [Solução de problemas de nó Android](/pt-BR/nodes/troubleshooting)
