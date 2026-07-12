---
read_when:
    - Emparelhando ou reconectando o Node iOS
    - Ativação ou solução de problemas do Node direto do Apple Watch
    - Executando o aplicativo iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou dos comandos do canvas
summary: 'Aplicativo de Node para iOS: conexão com o Gateway, pareamento, canvas e solução de problemas'
title: Aplicativo para iOS
x-i18n:
    generated_at: "2026-07-12T15:21:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: as compilações do aplicativo para iPhone são distribuídas pelos canais da Apple quando habilitadas para uma versão. Compilações de desenvolvimento local também podem ser executadas a partir do código-fonte.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe recursos do Node: Canvas, captura de tela, captura da câmera, localização, modo de conversa e ativação por voz.
- Recebe comandos `node.invoke` e relata eventos de status do Node.
- Permite navegar, em modo somente leitura, pelo workspace do agente selecionado na área Agentes (Arquivos): navegação por diretórios, visualizações de texto com realce de sintaxe, visualizações de imagens e exportação pela folha de compartilhamento. Não há operações de gravação; o tamanho das visualizações é limitado pelo gateway.
- Mantém um pequeno cache offline somente leitura das sessões e transcrições de conversas recentes por gateway emparelhado: em inicializações a frio, exibe imediatamente a última transcrição conhecida e a atualiza assim que o gateway responde; as conversas recentes continuam acessíveis enquanto estiver desconectado; e redefinir/esquecer limpa o cache local protegido.
- Coloca em uma caixa de saída durável por gateway as mensagens de texto enviadas enquanto estiver desconectado (até 50): os balões enfileirados aparecem na transcrição, são enviados em ordem ao reconectar com novas tentativas idempotentes, permanecem duráveis até que o histórico canônico confirme o envio, repetem a tentativa com recuo antes de exibir uma ação para tentar novamente/excluir e expiram em vez de serem enviados após 48 horas offline; redefinir/esquecer limpa a fila junto com o cache.
- Reproduz por voz as mensagens do assistente sob demanda: mantenha uma mensagem pressionada em Chat e escolha **Listen**. O aplicativo reproduz clipes `tts.speak` compatíveis do gateway com o provedor de TTS configurado e usa como alternativa a fala no dispositivo quando o áudio do gateway está indisponível ou não pode ser reproduzido. A reprodução para ao trocar de sessão ou enviar o aplicativo para segundo plano.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (alternativa).

## Início rápido (emparelhar + conectar)

1. Inicie um Gateway autenticado com uma rota que seu telefone possa alcançar. O Tailscale
   Serve é o caminho remoto recomendado:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para uma configuração confiável na mesma LAN, use um `gateway.bind: "lan"`
autenticado. A vinculação padrão ao loopback não pode ser acessada por um telefone. Se o
Gateway ainda não tiver sido configurado, execute primeiro `openclaw onboard` para que a criação
do código de configuração tenha um caminho de autenticação por token ou senha.

2. Abra a [IU de controle](/pt-BR/web/control-ui), selecione **Nodes** e clique em
   **Pair mobile device** na página **Devices**.

3. No aplicativo iOS, abra **Settings** -> **Gateway**, escaneie o código QR (ou cole
   o código de configuração) e conecte-se.

   Se o código de configuração contiver rotas de LAN e Tailscale Serve, o aplicativo
   as testará em ordem e salvará o primeiro endpoint acessível.

4. O aplicativo oficial se conecta automaticamente. Se **Pending approval** exibir uma
   solicitação, revise a função e os escopos antes de aprová-la.

O botão da IU de controle requer uma sessão já emparelhada com `operator.admin`.
Como alternativa pelo terminal, escolha um gateway descoberto no aplicativo iOS (ou habilite
Manual Host e informe o host/porta) e aprove a solicitação no host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o aplicativo tentar emparelhar novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o Node iOS sempre se conectar a partir de uma sub-rede rigidamente controlada, você poderá habilitar a aprovação automática do Node no primeiro emparelhamento com CIDRs explícitos ou IPs exatos:

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

Isso fica desabilitado por padrão. Aplica-se somente a um novo emparelhamento com `role: node` sem escopos solicitados. O emparelhamento de operador/navegador e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

5. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

Por padrão, o aplicativo complementar do Apple Watch continua usando o retransmissor existente do iPhone e
não precisa de um emparelhamento separado com o Gateway. Emparelhe o Watch com o iPhone no
aplicativo Watch da Apple, instale o OpenClaw em **Watch app -> My Watch -> Available
Apps** e abra o OpenClaw uma vez em ambos os dispositivos.

## Revisar aprovações de comandos

Uma conexão de operador com `operator.admin`, ou uma conexão
`operator.approvals` emparelhada e explicitamente direcionada pelo Gateway, pode revisar
solicitações de execução pendentes no iPhone. O cartão de aprovação mostra a
prévia sanitizada do comando pelo Gateway, o aviso, o contexto do host, a expiração e somente as
decisões oferecidas por essa solicitação. O Apple Watch emparelhado recebe a mesma
solicitação segura para o revisor por meio do retransmissor existente do iPhone e oferece o subconjunto compacto
de decisões permitir uma vez/negar. O modo de conexão direta do Watch ao Gateway não transmite
solicitações de aprovação.

O estado da aprovação é compartilhado com a IU de controle e as áreas de chat compatíveis. A
primeira resposta confirmada prevalece. O iPhone e o Watch buscam o registro terminal canônico
do Gateway depois que outra área resolve a solicitação, após uma notificação remota
de resolução e sempre que uma confirmação de resolução puder ter sido
perdida. As ações permanecem indisponíveis até que essa releitura confirme se a
solicitação continua pendente.

A propriedade da aprovação está vinculada ao Gateway selecionado. Trocar de gateway não pode
aplicar uma solicitação antiga à conexão substituta. Gateways anteriores aos
métodos de aprovação unificados usam como alternativa os métodos específicos de execução já distribuídos;
o estado terminal retido e resultados mais completos entre áreas exigem um
Gateway atualizado.

## Node direto opcional do Apple Watch

O modo direto fornece ao relógio sua própria identidade de Node assinada e conexão com o Gateway.
Os comandos de Node compatíveis continuam funcionando por Wi-Fi ou rede celular do relógio enquanto o
OpenClaw estiver ativo, mesmo quando o iPhone emparelhado estiver indisponível.

Requisitos:

- O iPhone está conectado ao Gateway com o escopo `operator.admin`.
- O código de configuração anuncia um endpoint do Gateway `wss://` com um certificado confiável
  para o watchOS; o relógio consulta a origem `https://` correspondente. HTTP simples e
  confiança apenas por certificado autoassinado ou impressão digital não são compatíveis. Consulte [Emparelhamento
  gerenciado pelo Gateway](/pt-BR/gateway/pairing) para configurar o endpoint. Rotas de loopback, exclusivas do iPhone
  e exclusivas da tailnet não podem ser acessadas de forma independente pelo relógio.
- O uso de rede celular exige um Apple Watch compatível com rede celular e serviço ativo.
- O OpenClaw está ativo no relógio. A Apple não permite que aplicativos comuns do watchOS
  mantenham conexões WebSocket/TCP genéricas, portanto o Node direto usa consultas HTTPS
  curtas e se reconecta quando o aplicativo retorna ao primeiro plano. Consulte as
  [orientações da Apple sobre redes de baixo nível no watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuração:

1. No iPhone, abra **Settings -> Apple Watch**.
2. Toque em **Enable Direct Gateway Connection**.
3. Abra o OpenClaw no relógio antes que o código de configuração de curta duração expire.
4. Verifique a linha separada do Apple Watch com `openclaw nodes status`.

O código de configuração contém uma credencial de inicialização de curta duração e exclusiva do Node; trate-a
como uma senha até que expire. Ele nunca contém a senha ou o token do Gateway
salvo no iPhone. Após o emparelhamento, o relógio armazena seu próprio token de dispositivo e
exclui a credencial de inicialização. O modo direto abrange somente os comandos abaixo.
Chat, conversa, aprovações e o fluxo de notificações `watch.*` existente continuam sendo
recursos do retransmissor do iPhone e ainda exigem o iPhone emparelhado.

Comandos diretos do Node watchOS:

| Área          | Comandos                       | Observações                                                     |
| ------------- | ------------------------------ | --------------------------------------------------------------- |
| Dispositivo   | `device.info`, `device.status` | Identidade do Watch, bateria, estado térmico, armazenamento e rede. |
| Notificações  | `system.notify`                | Enquanto o aplicativo está ativo; exige permissão do relógio.   |

O watchOS não disponibiliza o WebKit para aplicativos de terceiros, portanto o Node direto do relógio
não anuncia comandos do Canvas.

## Push com retransmissor para compilações oficiais

As compilações oficiais distribuídas do iOS usam um retransmissor de push externo em vez de publicar o token bruto do APNs no gateway. As compilações oficiais da App Store provenientes do fluxo público de lançamento usam o retransmissor hospedado em `https://ios-push-relay.openclaw.ai`; essa URL base é fixa na distribuição pela App Store e não lê nenhuma substituição.

Implantações com retransmissor personalizado exigem um caminho deliberadamente separado de compilação/implantação do iOS cuja URL do retransmissor corresponda à URL do retransmissor do gateway. O fluxo de lançamento da App Store nunca aceita uma URL de retransmissor personalizada. Se você estiver usando uma compilação com retransmissor personalizado, defina no gateway a URL correspondente do retransmissor:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Como o fluxo funciona:

- O aplicativo iOS se registra no retransmissor usando o App Attest e um JWS de transação de aplicativo do StoreKit.
- O retransmissor retorna um identificador opaco do retransmissor e uma autorização de envio limitada ao registro.
- O aplicativo iOS busca a identidade do gateway emparelhado (`gateway.identity.get`) e a inclui no registro do retransmissor, de modo que o registro baseado em retransmissor seja delegado a esse gateway específico.
- O aplicativo encaminha esse registro baseado em retransmissor ao gateway emparelhado com `push.apns.register`.
- O gateway usa o identificador armazenado do retransmissor para `push.test`, ativações em segundo plano e sinais de ativação.
- Se posteriormente o aplicativo se conectar a outro gateway ou a uma compilação com outra URL base do retransmissor, ele atualizará o registro no retransmissor em vez de reutilizar a vinculação antiga.

O que o gateway **não** precisa para esse caminho: nenhum token de retransmissor válido para toda a implantação, nenhuma chave direta do APNs para envios oficiais da App Store baseados em retransmissor.

Fluxo esperado para o operador:

1. Instale o aplicativo iOS oficial.
2. Opcional: defina `gateway.push.apns.relay.baseUrl` no gateway somente ao usar uma compilação personalizada com retransmissor deliberadamente separada.
3. Emparelhe o aplicativo com o gateway e aguarde a conclusão da conexão.
4. O aplicativo publica `push.apns.register` assim que obtém um token do APNs, a sessão do operador está conectada e o registro no retransmissor é concluído com sucesso.
5. Depois disso, `push.test`, ativações de reconexão e sinais de ativação podem usar o registro armazenado baseado em retransmissor.

## Sinais de atividade em segundo plano

Quando o iOS ativa o aplicativo devido a um push silencioso, uma atualização em segundo plano ou um evento de alteração significativa de localização, o aplicativo tenta uma breve reconexão do Node e, em seguida, chama `node.event` com `event: "node.presence.alive"`. O gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo emparelhado somente depois que a identidade autenticada do dispositivo Node é conhecida.

O aplicativo considera uma ativação em segundo plano registrada com sucesso somente quando a resposta do gateway inclui `handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é compatível, mas não conta como uma atualização durável do último acesso.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma substituição temporária por variável de ambiente para o gateway (`gateway.push.apns.relay.baseUrl` é o caminho que prioriza a configuração).
- O modo push da compilação de lançamento da App Store fixa o host do retransmissor hospedado e nunca lê uma substituição da URL do retransmissor — a variável de ambiente de compilação `OPENCLAW_PUSH_RELAY_BASE_URL` afeta somente os modos locais/sandbox de compilação do iOS.

## Fluxo de autenticação e confiança

O retransmissor existe para impor duas restrições que o APNs direto no gateway não consegue fornecer para compilações oficiais do iOS:

- Somente compilações genuínas do OpenClaw para iOS distribuídas pela Apple podem usar o retransmissor hospedado.
- Um gateway pode enviar notificações push baseadas em retransmissor somente para dispositivos iOS que foram emparelhados com esse gateway específico.

Etapa por etapa:

1. `iOS app -> gateway`: o aplicativo é pareado com o gateway pelo fluxo normal de autenticação do Gateway, recebendo uma sessão de Node autenticada e uma sessão de operador autenticada. A sessão de operador chama `gateway.identity.get`.
2. `iOS app -> relay`: o aplicativo chama os endpoints de registro do relay por HTTPS com a prova do App Attest e um JWS de transação do aplicativo do StoreKit. O relay valida o ID do pacote, a prova do App Attest e a prova de distribuição da Apple, e exige o caminho de distribuição oficial/de produção — é isso que impede builds locais do Xcode/de desenvolvimento de usar o relay hospedado, pois um build local não consegue satisfazer a prova de distribuição oficial da Apple.
3. `gateway identity delegation`: antes do registro no relay, o aplicativo obtém a identidade do gateway pareado de `gateway.identity.get` e a inclui no payload de registro do relay. O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegada a essa identidade do gateway.
4. `gateway -> relay`: o gateway armazena o identificador de relay e a concessão de envio provenientes de `push.apns.register`. Em `push.test`, reativações de reconexão e estímulos de reativação, o gateway assina a solicitação de envio com sua própria identidade de dispositivo; o relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway em relação à identidade delegada do gateway proveniente do registro. Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.
5. `relay -> APNs`: o relay possui as credenciais de produção do APNs e o token bruto do APNs para o build oficial. O gateway nunca armazena o token bruto do APNs para builds oficiais respaldados pelo relay; o relay envia a notificação push final ao APNs em nome do gateway pareado.

Por que esse design foi criado: para manter as credenciais de produção do APNs fora dos gateways dos usuários, evitar o armazenamento de tokens brutos do APNs de builds oficiais no gateway, permitir o uso do relay hospedado apenas para builds oficiais do OpenClaw para iOS e impedir que um gateway envie notificações push de reativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais continuam usando APNs direto. Se você estiver testando esses builds sem o relay, o gateway ainda precisará de credenciais diretas do APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas a autenticação do App Store Connect, como `APP_STORE_CONNECT_KEY_ID` e `APP_STORE_CONNECT_ISSUER_ID`; ele não configura a entrega direta via APNs para builds locais do iOS.

Armazenamento recomendado no host do gateway, consistente com outras credenciais de provedores em `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Não faça commit do arquivo `.p8` nem o coloque no checkout do repositório.

## Caminhos de descoberta

### Bonjour (LAN)

O aplicativo iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo domínio de descoberta DNS-SD de longa distância. Gateways na mesma LAN aparecem automaticamente por meio de `local.`; a descoberta entre redes pode usar o domínio de longa distância configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo: `openclaw.internal.`) e DNS dividido do Tailscale. Consulte [Bonjour](/pt-BR/gateway/bonjour) para ver o exemplo do CoreDNS.

### Host/porta manual

Em Settings, ative **Manual Host** e insira o host + porta do gateway (padrão `18789`).

## Vários gateways

O aplicativo mantém um registro de todos os gateways com os quais foi pareado, permitindo alternar entre eles sem precisar parear novamente:

- **Settings -> Gateway** mostra uma lista de **Gateways pareados**, com o gateway ativo marcado. Toque em uma entrada para alternar; o aplicativo encerra as sessões atuais e se reconecta ao gateway selecionado. Um menu de troca rápida aparece ao lado da linha de conexão quando há mais de um gateway pareado.
- Credenciais, decisões de confiança TLS, preferências por gateway e histórico de conversas em cache são armazenados separadamente para cada gateway. A alternância nunca mistura estados entre gateways, e o registro de notificações push acompanha o gateway ativo.
- Deslize um gateway pareado (ou use seu menu de contexto) para **Esquecer**, removendo suas credenciais, tokens de dispositivo, pin TLS e conversas em cache.
- Os gateways descobertos precisam estar visíveis na rede para que você possa alternar para eles; gateways manuais se reconectam usando o host e a porta salvos.

## Canvas + A2UI

O Node do iOS renderiza um canvas em uma WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host do canvas do Gateway disponibiliza `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` por meio do servidor HTTP do Gateway (a mesma porta de `gateway.port`, padrão `18789`).
- O Node do iOS mantém a estrutura integrada como visualização padrão quando conectado. `canvas.a2ui.push` e `canvas.a2ui.reset` usam a página A2UI incluída e pertencente ao aplicativo.
- As páginas A2UI remotas do Gateway são somente para renderização no iOS; ações nativas de botões A2UI são aceitas apenas em páginas incluídas e pertencentes ao aplicativo.
- Retorne à estrutura integrada usando `canvas.navigate` e `{"url":""}`.

## Relação com o Computer Use

O aplicativo para iOS é uma superfície de Node móvel, não um backend do Codex Computer Use. O Codex Computer Use e o `cua-driver mcp` controlam um desktop macOS local por meio de ferramentas MCP; o aplicativo para iOS expõe recursos do iPhone por meio de comandos de Node do OpenClaw, como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Os agentes ainda podem operar o aplicativo para iOS por meio do OpenClaw invocando comandos de Node, mas essas chamadas passam pelo protocolo de Node do gateway e seguem os limites de primeiro e segundo plano do iOS. Use o [Codex Computer Use](/pt-BR/plugins/codex-computer-use) para controlar o desktop local e esta página para conhecer os recursos do Node do iOS.

### Avaliação / captura do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo de conversa

- A ativação por voz e o modo de conversa estão disponíveis em Settings.
- A conversa em tempo real da OpenAI usa WebRTC gerenciado pelo cliente quando `talk.realtime.transport` é `webrtc`; uma configuração explícita de `gateway-relay` permanece sob responsabilidade do Gateway. Consulte [Modo de conversa](/pt-BR/nodes/talk).
- Nodes do iOS compatíveis com conversa anunciam o recurso `talk` e podem declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`; por padrão, o Gateway permite esses comandos de pressionar para falar para Nodes confiáveis compatíveis com conversa.
- O iOS pode suspender o áudio em segundo plano; considere os recursos de voz como sujeitos à disponibilidade quando o aplicativo não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o aplicativo para iOS para o primeiro plano (os comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_UNAVAILABLE`: não foi possível acessar a página A2UI incluída na WebView do aplicativo; mantenha o aplicativo em primeiro plano na aba Screen e tente novamente.
- A solicitação de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- O Watch não mostra o estado do iPhone: confirme se o iPhone informa `watchPaired: true`
  e `watchAppInstalled: true` em `watch.status`. Se o pareamento for falso, emparelhe o
  Watch no aplicativo Watch da Apple. Se a instalação for falsa, instale o aplicativo complementar
  em **My Watch -> Available Apps**. Após qualquer uma dessas alterações, abra o OpenClaw no
  Watch uma vez; a disponibilidade imediata ainda exige que ambos os aplicativos estejam em execução,
  enquanto atualizações enfileiradas podem chegar posteriormente em segundo plano.
- Falha ao reconectar após a reinstalação: o token de pareamento das Chaves foi apagado; emparelhe novamente o Node.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
