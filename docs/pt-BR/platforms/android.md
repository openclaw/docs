---
read_when:
    - Emparelhar ou reconectar o Node Android
    - Depuração da descoberta ou autenticação do Gateway no Android
    - Espelhamento ou controle de um dispositivo Android a partir de um Mac remoto
    - Verificando a paridade do histórico de conversas entre clientes
summary: 'Aplicativo Android (node): guia de conexão + conjunto de comandos de Conexão/Chat/Voz/Canvas'
title: Aplicativo Android
x-i18n:
    generated_at: "2026-07-12T15:21:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7cba1a3db2743dc9145ba5cd3eb3129b87952d7ec4090afd2776bb71a590627b
    source_path: platforms/android.md
    workflow: 16
---

<Note>
O app oficial para Android está disponível no [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) e como um APK autônomo assinado nas [versões do GitHub](https://github.com/openclaw/openclaw/releases) compatíveis. Ele é um Node complementar e requer um Gateway OpenClaw em execução. Código-fonte: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instruções de compilação](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Visão geral do suporte

- Função: aplicativo de Node complementar (o Android não hospeda o Gateway).
- Gateway necessário: sim (execute-o no macOS, Linux ou Windows via WSL2).
- Instalação: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) ou `OpenClaw-Android.apk` de uma [versão do GitHub](https://github.com/openclaw/openclaw/releases) compatível, [Primeiros passos](/pt-BR/start/getting-started) para o Gateway e, depois, [Emparelhamento](/pt-BR/channels/pairing).
- Gateway: [Guia operacional](/pt-BR/gateway) + [Configuração](/pt-BR/gateway/configuration).
  - Protocolos: [Protocolo do Gateway](/pt-BR/gateway/protocol) (Nodes + plano de controle).

O controle do sistema (launchd/systemd) reside no host do Gateway — consulte [Gateway](/pt-BR/gateway).

## Instalação fora do Google Play

As versões finais regulares e de correção no GitHub incluem um `OpenClaw-Android.apk` universal e `OpenClaw-Android-SHA256SUMS.txt`. O APK é compilado a partir da tag da versão, assinado com a chave de lançamento do OpenClaw para Android e inclui a procedência do GitHub Actions.

Escolha uma [versão](https://github.com/openclaw/openclaw/releases) que liste ambos os arquivos, depois baixe e verifique essa tag exata antes de instalar por sideload:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
As instalações pelo Google Play e por APK autônomo usam canais de atualização diferentes e podem ter identidades de assinatura distintas. O Android pode exigir a desinstalação do aplicativo existente antes da troca de canal, o que remove os dados locais do aplicativo. Permaneça em um único canal para as atualizações normais.
</Warning>

## Espelhar e controlar o Android de um Mac remoto

O [scrcpy](https://github.com/Genymobile/scrcpy) espelha a tela do Android em uma janela do macOS e
encaminha a entrada do teclado e do ponteiro pelo Android Debug Bridge (ADB). Esse é um fluxo de trabalho
do lado do operador, separado da conexão do Node OpenClaw. Ele é útil quando o dispositivo Android e o
Mac estão em locais diferentes, mas compartilham uma rede privada do Tailscale.

### Antes de começar

- Instale o Tailscale no dispositivo Android e no Mac e conecte ambos à mesma tailnet.
- No Android, habilite **Developer options** e **USB debugging**. O Android 16 coloca **Wireless
  debugging** em **Settings > System > Developer options**. Consulte [Opções de desenvolvedor do
  Android](https://developer.android.com/studio/debug/dev-options).
- Instale o scrcpy e o ADB no Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Mantenha o dispositivo Android disponível para a primeira conexão. O Android precisa aprovar a chave
  ADB de cada Mac antes que esse Mac possa controlar o dispositivo.

### Habilitar o ADB por TCP

Para a configuração inicial, conecte o dispositivo Android por USB a um computador confiável e aprove
a solicitação de depuração. Depois, execute:

```bash
adb devices
adb tcpip 5555
```

Agora você pode desconectar o USB. Se a porta 5555 parar de escutar após a reinicialização do dispositivo
ou a redefinição da depuração, repita esta etapa de configuração local. O Android 11 e versões posteriores
também podem estabelecer a confiança inicial com **Wireless debugging > Pair device with pairing code**
e `adb pair`.

### Permitir somente o Mac controlador

As tailnets com concessões restritivas devem permitir explicitamente que o Mac controlador acesse a porta
TCP 5555 no dispositivo Android. Adicione uma regra restrita à política da tailnet, substituindo os endereços
do exemplo pelos IPs Tailscale estáveis dos dois dispositivos:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Consulte [concessões do Tailscale](https://tailscale.com/docs/reference/syntax/grants) para aliases de host e outros
seletores. Não conceda acesso a essa porta pela internet pública nem a exponha com o Funnel: um cliente ADB
autorizado tem amplo controle do dispositivo.

### Conectar e iniciar o espelhamento

No Mac remoto:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

O primeiro `adb connect` deste Mac exibe uma caixa de diálogo de autorização no Android. Desbloqueie o dispositivo,
confirme a impressão digital da chave e selecione **Always allow from this computer** somente quando o Mac for
confiável. Uma entrada bem-sucedida de `adb devices` termina em `device`; `unauthorized` significa que a solicitação
no dispositivo ainda não foi aprovada.

Quando a janela do scrcpy abrir, use-a diretamente ou direcione a ela uma ferramenta de automação de tela do macOS,
como o [Peekaboo](https://peekaboo.sh/). O scrcpy transporta a exibição e a entrada; o Tailscale fornece apenas o
caminho de rede privado.

### Solução de problemas

- `Connection timed out`: verifique a concessão da tailnet para TCP 5555. Um `tailscale ping` bem-sucedido comprova
  a conectividade com o par, não que a política permita essa porta TCP. Teste com
  `nc -vz <android-tailnet-ip> 5555` no Mac.
- `unauthorized`: desbloqueie o Android e aprove a chave ADB do Mac remoto ou remova a estação de trabalho obsoleta
  em **Wireless debugging > Paired devices** e faça o emparelhamento novamente.
- `Connection refused`: reconecte localmente e execute `adb tcpip 5555` novamente.
- Mais de um dispositivo listado: mantenha o argumento explícito `--serial <android-tailnet-ip>:5555`.

Ao terminar, feche o scrcpy e desconecte o ADB:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Guia operacional de conexão

Aplicativo de Node para Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

O Android se conecta diretamente ao WebSocket do Gateway e usa o emparelhamento de dispositivos (`role: node`).

Para hosts no Tailscale ou públicos, o Android exige um endpoint seguro:

- Preferencial: Tailscale Serve / Funnel com `https://<magicdns>` / `wss://<magicdns>`
- Também compatível: qualquer outro URL `wss://` do Gateway com um endpoint TLS real
- O `ws://` sem criptografia continua compatível em endereços de LAN privada/hosts `.local`, além de `localhost`, `127.0.0.1` e a ponte do emulador Android (`10.0.2.2`)

### Pré-requisitos

- Gateway em execução em outra máquina (ou acessível via SSH).
- O dispositivo/emulador Android consegue acessar o WebSocket do Gateway:
  - Na mesma LAN com mDNS/NSD, **ou**
  - Na mesma tailnet do Tailscale usando Wide-Area Bonjour / DNS-SD unicast (veja abaixo), **ou**
  - Host/porta do Gateway configurados manualmente (alternativa)
- O emparelhamento móvel por tailnet/rede pública **não** usa endpoints `ws://` com IP bruto da tailnet. Em vez disso, use o Tailscale Serve ou outro URL `wss://`.
- A CLI `openclaw` está disponível na máquina do Gateway (ou via SSH) para aprovar solicitações de emparelhamento.

### 1. Iniciar o Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirme nos logs que você vê algo como:

- `listening on ws://0.0.0.0:18789`

Para acesso remoto do Android pelo Tailscale, prefira Serve/Funnel em vez de uma vinculação bruta à tailnet:

```bash
openclaw gateway --tailscale serve
```

Isso fornece ao Android um endpoint seguro `wss://` / `https://`. Uma configuração simples de `gateway.bind: "tailnet"` não é suficiente para o primeiro emparelhamento remoto do Android, a menos que você também encerre o TLS separadamente.

### 2. Verificar a descoberta (opcional)

Na máquina do Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Mais observações de depuração: [Bonjour](/pt-BR/gateway/bonjour).

Se você também configurou um domínio de descoberta de longa distância, compare com:

```bash
openclaw gateway discover --json
```

Isso mostra `local.` e o domínio de longa distância configurado em uma única execução, usando o endpoint de serviço resolvido em vez de apenas indicações TXT.

#### Descoberta entre redes por DNS-SD unicast

A descoberta NSD/mDNS do Android não atravessa redes. Se o Node Android e o Gateway estiverem em redes diferentes, mas conectados pelo Tailscale, use Wide-Area Bonjour / DNS-SD unicast. A descoberta por si só não é suficiente para o emparelhamento do Android por tailnet/rede pública — a rota descoberta ainda precisa de um endpoint seguro (`wss://` ou Tailscale Serve):

1. Configure uma zona DNS-SD (por exemplo, `openclaw.internal.`) no host do Gateway e publique registros `_openclaw-gw._tcp`.
2. Configure o DNS dividido do Tailscale para o domínio escolhido, apontando para esse servidor DNS.

Detalhes e exemplo de configuração do CoreDNS: [Bonjour](/pt-BR/gateway/bonjour).

### 3. Conectar pelo Android

No aplicativo Android:

- O aplicativo mantém a conexão com o Gateway ativa por meio de um **serviço em primeiro plano** (notificação persistente).
- Abra a guia **Conectar**.
- Use o modo **Código de configuração** ou **Manual**.
- Se a descoberta estiver bloqueada, use host/porta manuais em **Controles avançados**. Para hosts de LAN privada, `ws://` ainda funciona. Para hosts do Tailscale/públicos, ative o TLS e use um endpoint `wss://` / Tailscale Serve.

Após o primeiro emparelhamento bem-sucedido, o Android se reconecta automaticamente na inicialização ao Gateway emparelhado ativo (em caráter de melhor esforço para Gateways descobertos, que precisam estar visíveis na rede).

### Vários Gateways

O aplicativo mantém um registro de cada Gateway com o qual foi emparelhado, para que você possa alternar entre eles sem refazer o emparelhamento:

- **Configurações -> Gateways** lista os Gateways emparelhados, com o ativo marcado. Toque em uma entrada para alternar; o aplicativo encerra as sessões atuais e se reconecta ao Gateway selecionado.
- A guia **Conectar** mostra um seletor rápido quando há mais de um Gateway emparelhado.
- Credenciais, tokens de dispositivo, confiança TLS, histórico de chat e mensagens offline na fila são armazenados por Gateway. A alternância nunca mistura o estado entre Gateways, e as mensagens colocadas na fila enquanto estiver offline são entregues somente ao Gateway para o qual foram escritas.
- **Esquecer** remove a entrada de registro de um Gateway, juntamente com suas credenciais, tokens de dispositivo, pin TLS e chats em cache.

### Sinalizadores de presença ativa

Depois que a sessão autenticada do Node se conecta e quando o aplicativo passa para segundo plano enquanto o serviço em primeiro plano ainda está conectado, o Android chama `node.event` com `event: "node.presence.alive"`. O Gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo emparelhado somente depois que a identidade autenticada do dispositivo Node é conhecida.

O aplicativo considera o sinalizador registrado com sucesso somente quando a resposta do Gateway inclui `handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é compatível, mas não conta como uma atualização persistente da última visualização.

### 4. Aprovar o emparelhamento (CLI)

Na máquina do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalhes do emparelhamento: [Emparelhamento](/pt-BR/channels/pairing).

Opcional: se o Node Android sempre se conectar de uma sub-rede rigidamente controlada, você pode optar pela aprovação automática do primeiro emparelhamento do Node com CIDRs explícitos ou IPs exatos:

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

Isso fica desabilitado por padrão. Aplica-se apenas ao primeiro emparelhamento com `role: node` sem escopos solicitados. O emparelhamento de operador/navegador e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

### 5. Verificar se o Node está conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat + histórico

A guia Chat do Android permite selecionar a sessão (a padrão é `main`, além de outras sessões existentes):

- Histórico: `chat.history` (normalizado para exibição — tags de diretivas inline, cargas XML de chamadas de ferramentas em texto simples (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` e variantes truncadas) e tokens de controle de modelo ASCII/de largura completa vazados são removidos; linhas do assistente com tokens silenciosos, como os valores exatos `NO_REPLY` / `no_reply`, são omitidas; linhas grandes demais podem ser substituídas por espaços reservados)
- Envio: `chat.send`
- Envio durável: cada envio (texto, imagens selecionadas e mensagens de voz) é registrado em uma caixa de saída no dispositivo, específica de cada Gateway, antes de qualquer tentativa de rede; assim, o encerramento do aplicativo não pode causar a perda de uma entrada enviada. Os envios enfileirados enquanto o dispositivo está offline são entregues em ordem após a reconexão, com chaves de idempotência estáveis, e um envio só é removido da fila depois que o turno fica visível no `chat.history` canônico — apenas uma confirmação não é considerada prova de entrega. Resultados ambíguos (confirmação perdida, aplicativo encerrado durante o envio, reinicialização do Gateway antes da gravação da transcrição) aparecem como linhas visíveis com as opções explícitas **Tentar novamente**/**Excluir**, em vez de serem reenviados automaticamente. Comandos de barra nunca são repetidos automaticamente após uma reconexão; eles ficam aguardando uma nova tentativa explícita. A fila é limitada (50 mensagens e 48 MB de bytes de anexos por Gateway), e as linhas não enviadas expiram após 48 horas. Rascunhos do compositor que nunca foram enviados não são persistentes entre processos.
- Atualizações push (melhor esforço): `chat.subscribe` -> `event:"chat"`
- Ouvir: mantenha pressionada uma mensagem do assistente e escolha **Ouvir** para escutá-la; o áudio é renderizado pelo `tts.speak` do Gateway usando a cadeia de provedores de TTS configurada, e o TTS do sistema no dispositivo é usado quando o Gateway não consegue renderizar o áudio. A reprodução é interrompida ao trocar de sessão, iniciar um novo chat, colocar o aplicativo em segundo plano ou fechar o chat.

### 7. Canvas + câmera

#### Host do Canvas do Gateway (recomendado para conteúdo web)

Para que o Node exiba HTML/CSS/JS reais que o agente possa editar no disco, aponte o Node para o host do Canvas do Gateway.

<Note>
Os Nodes carregam o Canvas do servidor HTTP do Gateway (a mesma porta que `gateway.port`, padrão `18789`).
</Note>

1. Crie `~/.openclaw/workspace/canvas/index.html` no host do Gateway.
2. Navegue o Node até ele (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): se ambos os dispositivos estiverem no Tailscale, use um nome MagicDNS ou IP da tailnet em vez de `.local`, por exemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Esse servidor injeta um cliente de recarregamento em tempo real no HTML e recarrega quando os arquivos são alterados. O Gateway também disponibiliza `/__openclaw__/a2ui/`, mas o aplicativo Android trata páginas A2UI remotas apenas para renderização. Os comandos A2UI com ações usam a página A2UI incluída e controlada pelo aplicativo.

Comandos do Canvas (somente em primeiro plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (use `{"url":""}` ou `{"url":"/"}` para retornar à estrutura padrão). `canvas.snapshot` retorna `{ format, base64 }` (padrão `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias legado `canvas.a2ui.pushJSONL`). Eles usam a página A2UI incluída e controlada pelo aplicativo para renderização com ações.

Comandos da câmera (somente em primeiro plano; sujeitos a permissão): `camera.snap` (jpg), `camera.clip` (mp4). Consulte [Node de câmera](/pt-BR/nodes/camera) para ver parâmetros e auxiliares da CLI.

### 8. Voz + superfície ampliada de comandos do Android

- Aba Voz: o Android tem dois modos explícitos de captura. **Microfone** é uma sessão manual da aba Voz que envia cada pausa como um turno de chat e é interrompida quando o aplicativo sai do primeiro plano ou o usuário deixa a aba Voz. **Conversa** é o Modo de Conversa contínuo e continua ouvindo até ser desativado ou o Node se desconectar.
- O Modo de Conversa promove o serviço existente em primeiro plano de `connectedDevice` para `connectedDevice|microphone` antes do início da captura e o rebaixa quando o Modo de Conversa é interrompido. O serviço do Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` com `CHANGE_NETWORK_STATE`; o Android 14+ também exige a declaração `FOREGROUND_SERVICE_MICROPHONE`, a concessão de `RECORD_AUDIO` em tempo de execução e o tipo de serviço de microfone em tempo de execução.
- Por padrão, o Modo de Conversa do Android usa reconhecimento de fala nativo, chat do Gateway e `talk.speak` por meio do provedor de Conversa configurado no Gateway. O TTS do sistema local é usado somente quando `talk.speak` não está disponível.
- O Modo de Conversa do Android usa a retransmissão em tempo real do Gateway somente quando `talk.realtime.mode` é `realtime` e `talk.realtime.transport` é `gateway-relay`.
- O Android não anuncia o recurso `voiceWake`. Use **Microfone** ou **Conversa** para entrada de voz.
- Famílias adicionais de comandos do Android (a disponibilidade depende do dispositivo, das permissões e das configurações do usuário):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` somente quando **Settings > Phone Capabilities > Installed Apps** está habilitado; por padrão, lista os aplicativos visíveis no inicializador (passe `includeNonLaunchable` para obter a lista completa).
  - `notifications.list`, `notifications.actions` (consulte [Encaminhamento de notificações](#notification-forwarding) abaixo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Arquivos do espaço de trabalho (somente leitura)

A visão geral da tela inicial inclui um cartão **Arquivos** que permite navegar pelo espaço de trabalho do agente ativo por meio das RPCs somente leitura `agents.workspace.list` / `agents.workspace.get` do Gateway: navegação detalhada por diretórios, visualizações de texto e imagem e exportação por meio da folha de compartilhamento do Android. Não há operações de gravação, e o tamanho das visualizações é limitado pelo Gateway.

## Revisar aprovações de comandos

Uma conexão de operador com `operator.admin`, ou uma conexão
`operator.approvals` pareada e explicitamente direcionada pelo Gateway, pode revisar
solicitações de execução pendentes em **Configurações -> Aprovações**. O aplicativo carrega o
registro de aprovação sanitizado do Gateway antes de habilitar seus botões, exibe qualquer
aviso de segurança e as decisões exatas oferecidas pela solicitação e envia
o ID da aprovação e o tipo de proprietário de volta ao Gateway.

O estado da aprovação é compartilhado com a interface de controle e as superfícies de chat compatíveis. A
primeira resposta confirmada prevalece; o Android exibe esse resultado canônico mesmo quando
outra superfície respondeu primeiro. Se uma resposta de resolução for perdida ou o Gateway
se desconectar, o aplicativo mantém a ação bloqueada e lê a aprovação novamente
antes de oferecer outra decisão.

Gateways anteriores aos métodos unificados de aprovação recorrem aos métodos
específicos de execução fornecidos originalmente. A revisão pendente continua funcionando, mas o estado
de terminal preservado e o resultado mais completo entre superfícies exigem um Gateway atualizado.

## Pontos de entrada do assistente

O Android permite iniciar o OpenClaw pelo acionador do assistente do sistema (Google Assistant). Manter pressionado o botão inicial (ou outro acionador `ACTION_ASSIST`) abre o aplicativo; dizer "Hey Google, ask OpenClaw `<prompt>`" corresponde ao padrão de consulta de App Actions declarado pelo aplicativo e transfere o prompt para o compositor do chat sem enviá-lo automaticamente.

Isso usa as **App Actions** do Android (recurso de `shortcuts.xml`) declaradas no manifesto do aplicativo. Nenhuma configuração no Gateway é necessária — a intenção do assistente é tratada inteiramente pelo aplicativo Android.

<Note>
A disponibilidade das App Actions depende do dispositivo, da versão do Google Play Services e de o usuário ter definido o OpenClaw como o aplicativo de assistente padrão.
</Note>

## Encaminhamento de notificações

O Android pode encaminhar notificações do dispositivo ao Gateway como itens `node.event`. Isso é configurado **no dispositivo**, na tela Settings do aplicativo — não na configuração do Gateway/`openclaw.json`.

| Configuração                | Descrição                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Alternância principal. Desativada por padrão; exige que o acesso ao Listener de Notificações seja concedido primeiro.                                                                                                        |
| Package Filter              | **Allowlist** (somente os IDs de pacotes listados são encaminhados) ou **Blocklist** (padrão: todos os pacotes, exceto os IDs listados). O próprio pacote do OpenClaw é sempre excluído no modo Blocklist para evitar ciclos de encaminhamento. |
| Quiet Hours                 | Janela local de início/fim em HH:mm que impede o encaminhamento. Desativada por padrão; os valores padrão são `22:00`-`07:00` quando habilitada.                                                                              |
| Max Events / Minute         | Limite de taxa por dispositivo para notificações encaminhadas. Padrão: 20.                                                                                                                                                   |
| Route Session Key           | Opcional. Fixa os eventos de notificação encaminhados em uma sessão específica, em vez da rota de notificação padrão do dispositivo.                                                                                         |

<Note>
O encaminhamento de notificações exige a permissão de Listener de Notificações do Android. O aplicativo solicita essa permissão durante a configuração.
</Note>

As notificações do WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord e Signal são sempre excluídas. As mensagens desses aplicativos já pertencem a sessões de canais nativos do OpenClaw; encaminhar a notificação do Android como um evento separado do Node poderia direcionar uma resposta para a conversa errada.

## Relacionados

- [Aplicativo para iOS](/pt-BR/platforms/ios)
- [Nodes](/pt-BR/nodes)
- [Solução de problemas do Node Android](/pt-BR/nodes/troubleshooting)
