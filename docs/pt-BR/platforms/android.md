---
read_when:
    - Emparelhando ou reconectando o Node Android
    - Depuração da descoberta do Gateway ou da autenticação no Android
    - Verificando a paridade do histórico de chat entre clientes
summary: 'Aplicativo Android (nó): runbook de conexão + superfície de comandos de Conectar/Chat/Voz/Canvas'
title: Aplicativo Android
x-i18n:
    generated_at: "2026-04-30T09:57:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
O aplicativo Android ainda não foi lançado publicamente. O código-fonte está disponível no [repositório OpenClaw](https://github.com/openclaw/openclaw) em `apps/android`. Você pode compilá-lo por conta própria usando Java 17 e o Android SDK (`./gradlew :app:assemblePlayDebug`). Consulte [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para instruções de compilação.
</Note>

## Resumo de suporte

- Função: aplicativo Node companheiro (Android não hospeda o Gateway).
- Gateway obrigatório: sim (execute-o no macOS, Linux ou Windows via WSL2).
- Instalação: [Primeiros passos](/pt-BR/start/getting-started) + [Pareamento](/pt-BR/channels/pairing).
- Gateway: [Runbook](/pt-BR/gateway) + [Configuração](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (nodes + plano de controle).

## Controle do sistema

O controle do sistema (launchd/systemd) fica no host do Gateway. Consulte [Gateway](/pt-BR/gateway).

## Runbook de conexão

Aplicativo Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao WebSocket do Gateway e usa pareamento de dispositivo (`role: node`).

Para Tailscale ou hosts públicos, o Android exige um endpoint seguro:

- Preferencial: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outra URL de Gateway `wss://` com um endpoint TLS real
- `ws://` em texto claro continua compatível em endereços de LAN privada / hosts `.local`, além de `localhost`, `127.0.0.1` e a ponte do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Você consegue executar o Gateway na máquina “master”.
- O dispositivo/emulador Android consegue acessar o WebSocket do gateway:
  - Mesma LAN com mDNS/NSD, **ou**
  - Mesma tailnet Tailscale usando Wide-Area Bonjour / DNS-SD unicast (veja abaixo), **ou**
  - Host/porta do gateway manual (fallback)
- O pareamento móvel via tailnet/público **não** usa endpoints `ws://` com IP bruto da tailnet. Use Tailscale Serve ou outra URL `wss://`.
- Você consegue executar a CLI (`openclaw`) na máquina do gateway (ou via SSH).

### 1) Iniciar o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso remoto do Android via Tailscale, prefira Serve/Funnel em vez de vincular diretamente à tailnet:

```bash
openclaw gateway --tailscale serve
```

Isso fornece ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples de `gateway.bind: "tailnet"` não é suficiente para o primeiro pareamento remoto do Android, a menos que você também termine TLS separadamente.

### 2) Verificar descoberta (opcional)

A partir da máquina do gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais notas de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta de área ampla, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` mais o domínio de área ampla configurado em uma única passagem e usa o endpoint
de serviço resolvido em vez de dicas somente por TXT.

#### Descoberta na tailnet (Viena ⇄ Londres) via DNS-SD unicast

A descoberta NSD/mDNS do Android não atravessa redes. Se o Node Android e o gateway estiverem em redes diferentes, mas conectados via Tailscale, use Wide-Area Bonjour / DNS-SD unicast.

A descoberta sozinha não é suficiente para pareamento Android via tailnet/público. A rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (exemplo `openclaw.internal.`) no host do gateway e publique registros `_openclaw-gw._tcp`.
2. Configure o DNS dividido do Tailscale para o domínio escolhido apontando para esse servidor DNS.

Detalhes e exemplo de configuração CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3) Conectar a partir do Android

No aplicativo Android:

- O aplicativo mantém sua conexão com o gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a aba **Conectar**.
- Use o modo **Código de configuração** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manual em **Controles avançados**. Para hosts de LAN privada, `ws://` ainda funciona. Para hosts Tailscale/públicos, ative TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro pareamento bem-sucedido, o Android reconecta automaticamente ao iniciar:

- Endpoint manual (se ativado), caso contrário
- O último gateway descoberto (melhor esforço).

### Beacons de presença ativa

Depois que a sessão Node autenticada se conecta, e quando o aplicativo vai para segundo plano enquanto o
serviço em primeiro plano ainda está conectado, o Android chama `node.event` com
`event: "node.presence.alive"`. O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos
metadados do Node/dispositivo pareado somente depois que a identidade autenticada do dispositivo Node é conhecida.

O aplicativo conta o beacon como registrado com sucesso somente quando a resposta do gateway inclui
`handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é
compatível, mas não conta como uma atualização durável de última visualização.

### 4) Aprovar pareamento (CLI)

Na máquina do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes de pareamento: [Pareamento](/pt-BR/channels/pairing).

Opcional: se o Node Android sempre se conecta a partir de uma sub-rede rigidamente controlada,
você pode optar pela aprovação automática de Node no primeiro uso com CIDRs explícitos ou IPs exatos:

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

Isso vem desativado por padrão. Aplica-se apenas a pareamento `role: node` novo, sem
escopos solicitados. Pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou
chave pública ainda exigem aprovação manual.

### 5) Verificar se o Node está conectado

- Via status de nodes:

  ```bash
  openclaw nodes status
  ```

- Via Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + histórico

A aba Chat do Android oferece suporte à seleção de sessão (padrão `main`, além de outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição; tags de diretivas inline são
  removidas do texto visível, payloads XML de chamadas de ferramenta em texto puro (incluindo
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e
  blocos de chamadas de ferramenta truncados) e tokens de controle do modelo ASCII/largura completa vazados
  são removidos, linhas de assistente com tokens puramente silenciosos, como `NO_REPLY` /
  `no_reply` exatos, são omitidas, e linhas grandes demais podem ser substituídas por placeholders)
- Envio: `chat.send`
- Atualizações push (melhor esforço): `chat.subscribe` → `event:"chat"`

### 7) Canvas + câmera

#### Host de Canvas do Gateway (recomendado para conteúdo web)

Se você quiser que o Node mostre HTML/CSS/JS real que o agente possa editar no disco, aponte o Node para o host de canvas do Gateway.

<Note>
Nodes carregam canvas a partir do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
</Note>

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do gateway.

2. Navegue o Node até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP da tailnet em vez de `.local`, por exemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de recarregamento ao vivo no HTML e recarrega quando arquivos mudam.
O host A2UI fica em `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar ao scaffold padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias legado)

Comandos de câmera (somente em primeiro plano; dependem de permissão):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulte [Node de câmera](/pt-BR/nodes/camera) para parâmetros e auxiliares da CLI.

### 8) Voz + superfície expandida de comandos Android

- Aba Voz: o Android tem dois modos explícitos de captura. **Mic** é uma sessão manual da aba Voz que envia cada pausa como uma rodada de chat e para quando o aplicativo sai do primeiro plano ou o usuário sai da aba Voz. **Talk** é o Talk Mode contínuo e continua ouvindo até ser desativado ou até o Node desconectar.
- O Talk Mode promove o serviço em primeiro plano existente de `dataSync` para `dataSync|microphone` antes do início da captura e depois o rebaixa quando o Talk Mode para. Android 14+ exige a declaração `FOREGROUND_SERVICE_MICROPHONE`, a concessão em tempo de execução `RECORD_AUDIO` e o tipo de serviço de microfone em tempo de execução.
- Respostas faladas usam `talk.speak` por meio do provedor Talk configurado no gateway. O TTS local do sistema é usado somente quando `talk.speak` não está disponível.
- O acionamento por voz continua desativado na UX/runtime do Android.
- Famílias adicionais de comandos Android (a disponibilidade depende do dispositivo + permissões):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (veja [Encaminhamento de notificações](#notification-forwarding) abaixo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Pontos de entrada do assistente

O Android oferece suporte à inicialização do OpenClaw a partir do acionador de assistente do sistema (Google
Assistant). Quando configurado, manter o botão home pressionado ou dizer "Hey Google, ask
OpenClaw..." abre o aplicativo e entrega o prompt ao compositor de chat.

Isso usa metadados **App Actions** do Android declarados no manifesto do aplicativo. Nenhuma
configuração extra é necessária no lado do gateway -- a intent do assistente é
tratada inteiramente pelo aplicativo Android e encaminhada como uma mensagem de chat normal.

<Note>
A disponibilidade de App Actions depende do dispositivo, da versão do Google Play Services
e de o usuário ter definido o OpenClaw como aplicativo assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo para o gateway como eventos. Vários controles permitem delimitar quais notificações são encaminhadas e quando.

| Chave                            | Tipo           | Descrição                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | Encaminhar apenas notificações destes nomes de pacotes. Se definido, todos os outros pacotes são ignorados. |
| `notifications.denyPackages`     | string[]       | Nunca encaminhar notificações destes nomes de pacotes. Aplicado após `allowPackages`.                  |
| `notifications.quietHours.start` | string (HH:mm) | Início da janela de horário silencioso (hora local do dispositivo). As notificações são suprimidas durante essa janela. |
| `notifications.quietHours.end`   | string (HH:mm) | Fim da janela de horário silencioso.                                                                   |
| `notifications.rateLimit`        | number         | Máximo de notificações encaminhadas por pacote por minuto. Notificações excedentes são descartadas.    |

O seletor de notificações também usa comportamento mais seguro para eventos de notificação encaminhados, impedindo o encaminhamento acidental de notificações sensíveis do sistema.

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
- [Solução de problemas do Node Android](/pt-BR/nodes/troubleshooting)
