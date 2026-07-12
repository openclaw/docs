---
read_when:
    - Emparelhando ou reconectando o Node do iOS
    - Ativação ou solução de problemas do Node direto do Apple Watch
    - Executando o aplicativo iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou dos comandos do canvas
summary: 'Aplicativo Node para iOS: conexão com o Gateway, emparelhamento, canvas e solução de problemas'
title: Aplicativo para iOS
x-i18n:
    generated_at: "2026-07-12T21:34:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf3c90d9b9be2fdfd1e4b85eebe9b79fe17a8f4aeaf05b60d4911c781e87c075
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: as compilações do aplicativo para iPhone são distribuídas pelos canais da Apple quando habilitadas para uma versão. Compilações locais de desenvolvimento também podem ser executadas a partir do código-fonte.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe recursos do Node: Canvas, captura de tela, captura da câmera, localização, modo de conversa, ativação por voz e resumos opcionais de Saúde.
- Recebe comandos `node.invoke` e relata eventos de status do Node.
- Permite navegar no espaço de trabalho do agente selecionado em modo somente leitura pela superfície Agentes (Arquivos): navegação detalhada por diretórios, pré-visualizações de texto com realce de sintaxe, pré-visualizações de imagens e exportação pela folha de compartilhamento. Não há operações de gravação; o Gateway limita o tamanho das pré-visualizações.
- Mantém um pequeno cache offline somente leitura das sessões e transcrições de conversas recentes para cada Gateway pareado: ao iniciar sem dados em memória, exibe imediatamente a última transcrição conhecida e a atualiza quando o Gateway responde; as conversas recentes permanecem navegáveis enquanto não há conexão; e redefinir/esquecer limpa o cache local protegido.
- Coloca em uma caixa de saída durável por Gateway as mensagens de texto enviadas enquanto não há conexão (até 50): os balões na fila aparecem na transcrição, são enviados em ordem na reconexão com novas tentativas idempotentes, permanecem armazenados até que o histórico canônico confirme o envio, repetem a tentativa com espera progressiva antes de exibir uma ação de tentar novamente/excluir e expiram, em vez de serem enviados, após 48 horas offline; redefinir/esquecer limpa a fila junto com o cache.
- Reproduz por voz as mensagens do assistente sob demanda: mantenha uma mensagem pressionada em Chat e escolha **Ouvir**. O aplicativo reproduz clipes `tts.speak` compatíveis do Gateway com o provedor de TTS configurado e recorre à fala no dispositivo quando o áudio do Gateway está indisponível ou não pode ser reproduzido. A reprodução é interrompida ao trocar de sessão ou colocar o aplicativo em segundo plano.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (alternativa).

## Início rápido (parear + conectar)

1. Inicie um Gateway autenticado com uma rota acessível pelo telefone. O Tailscale
   Serve é o caminho remoto recomendado:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para uma configuração confiável na mesma LAN, use um `gateway.bind: "lan"`
autenticado. A vinculação de loopback padrão não pode ser acessada por um telefone. Se o
Gateway ainda não tiver sido configurado, execute `openclaw onboard` primeiro para que a criação
do código de configuração tenha um caminho de autenticação por token ou senha.

2. Abra a [interface de controle](/pt-BR/web/control-ui), selecione **Nodes** e clique em
   **Pair mobile device** na página **Devices**.

3. No aplicativo para iOS, abra **Settings** -> **Gateway**, escaneie o código QR (ou cole
   o código de configuração) e conecte-se.

   Se o código de configuração contiver rotas de LAN e do Tailscale Serve, o aplicativo
   as testará em ordem e salvará o primeiro endpoint acessível.

4. O aplicativo oficial se conecta automaticamente. Se **Pending approval** exibir uma
   solicitação, revise a função e os escopos antes de aprová-la.

O botão da interface de controle exige uma sessão já pareada com `operator.admin`.
Como alternativa pelo terminal, escolha um Gateway descoberto no aplicativo para iOS (ou habilite
Manual Host e informe o host/a porta) e aprove a solicitação no host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o aplicativo tentar parear novamente com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o Node iOS sempre se conectar a partir de uma sub-rede rigidamente controlada, você poderá habilitar a aprovação automática do Node no primeiro acesso com CIDRs explícitos ou IPs exatos:

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

Esse recurso é desabilitado por padrão. Ele se aplica somente a um novo pareamento com `role: node` e sem escopos solicitados. O pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

5. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resumos de Saúde

O Node iOS pode retornar um agregado somente leitura no dispositivo para `today`. O resumo
fixo inclui passos, duração do sono, frequência cardíaca média em repouso e contagem/duração
dos exercícios. Ele nunca retorna amostras individuais do HealthKit,
fontes, metadados, registros clínicos ou acesso de gravação.

Essa superfície tem duas habilitações opcionais independentes:

1. No aplicativo para iOS, abra **Settings -> Permissions -> Privacy & Access -> Health Summaries** e
   toque em **Enable & Share Summaries**. O aviso explica que o agregado solicitado
   sai do telefone pelo seu Gateway, chega ao provedor de IA configurado
   e pode permanecer no histórico de conversas.
2. Adicione `health.summary` a `gateway.nodes.allowCommands`, rejeite e
   aprove novamente a superfície alterada de comandos do Node do iPhone. Mantenha o Gateway local
   ou restrito à tailnet; a auditoria de segurança relata esse comando confidencial quando ele está
   habilitado.

Os modelos usam a ferramenta `nodes` existente com `action: "invoke"`,
`invokeCommand: "health.summary"` e `invokeParamsJson` definido como
`{"period":"today"}`.

O HealthKit não revela deliberadamente se o acesso de leitura foi negado. Portanto, a ausência
de métricas significa apenas que nenhum valor legível foi retornado; ela não
comprova nem a negação nem a ausência de dados de saúde. O OpenClaw limita os resumos ao
dia atual do calendário para que uma janela limitada de acesso ao histórico não faça um
total de vários dias parecer completo. O OpenClaw não processa dados de Saúde em
segundo plano e não usa os resumos para diagnóstico ou orientação médica.

Por padrão, o aplicativo complementar do Apple Watch continua usando a retransmissão existente do iPhone e
não precisa de um pareamento separado com o Gateway. Pareie o Watch com o iPhone no
aplicativo Watch da Apple, instale o OpenClaw em **Watch app -> My Watch -> Available
Apps** e abra o OpenClaw uma vez nos dois dispositivos.

## Revisar aprovações de comandos

Uma conexão de operador com `operator.admin`, ou uma conexão pareada
`operator.approvals` direcionada explicitamente pelo Gateway, pode revisar
solicitações de execução pendentes no iPhone. O cartão de aprovação mostra a
pré-visualização sanitizada do comando pelo Gateway, o aviso, o contexto do host, a expiração e somente as
decisões oferecidas por essa solicitação. O Apple Watch pareado recebe o mesmo
aviso seguro para o revisor pela retransmissão existente do iPhone e oferece o subconjunto compacto
de decisões permitir uma vez/negar. O modo direto do Gateway no Watch não transporta
solicitações de aprovação.

O estado da aprovação é compartilhado com a interface de controle e as superfícies de conversa compatíveis. A
primeira resposta confirmada prevalece. O iPhone e o Watch consultam o registro
terminal canônico do Gateway depois que outra superfície resolve a solicitação, após uma
notificação remota de resolução e sempre que uma confirmação de resolução puder ter sido
perdida. As ações permanecem indisponíveis até que essa releitura confirme se a
solicitação continua pendente.

A propriedade da aprovação é vinculada ao Gateway selecionado. Trocar de Gateway não permite
aplicar uma solicitação antiga à conexão substituta. Gateways anteriores aos
métodos de aprovação unificados recorrem aos métodos específicos de execução já disponibilizados;
o estado terminal mantido e resultados mais completos entre superfícies exigem um
Gateway atualizado.

## Node direto opcional do Apple Watch

O modo direto fornece ao relógio uma identidade própria de Node assinada e uma conexão com o Gateway.
Os comandos de Node compatíveis continuam funcionando por Wi-Fi ou rede celular no relógio enquanto
o OpenClaw estiver ativo, mesmo quando o iPhone pareado estiver indisponível.

Requisitos:

- O iPhone está conectado ao Gateway com o escopo `operator.admin`.
- O código de configuração anuncia um endpoint `wss://` do Gateway com um certificado confiável
  para o watchOS; o relógio consulta a origem `https://` correspondente. HTTP simples e
  confiança apenas por certificado autoassinado ou impressão digital não são compatíveis. Consulte [Pareamento gerenciado pelo
  Gateway](/pt-BR/gateway/pairing) para ver a configuração do endpoint. Rotas de loopback, exclusivas do iPhone
  e exclusivas da tailnet não podem ser acessadas de forma independente pelo relógio.
- O uso da rede celular exige um Apple Watch com suporte a rede celular e serviço ativo.
- O OpenClaw está ativo no relógio. A Apple não permite que aplicativos comuns do watchOS
  mantenham conexões WebSocket/TCP genéricas; portanto, o Node direto usa consultas HTTPS
  curtas e se reconecta quando o aplicativo volta ao primeiro plano. Consulte as
  [orientações da Apple sobre redes de baixo nível no watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuração:

1. No iPhone, abra **Settings -> Apple Watch**.
2. Toque em **Enable Direct Gateway Connection**.
3. Abra o OpenClaw no relógio antes que o código de configuração de curta duração expire.
4. Verifique a linha separada do Apple Watch com `openclaw nodes status`.

O código de configuração contém uma credencial de inicialização de curta duração exclusiva para o Node; trate-a
como uma senha até que expire. Ele nunca contém a senha ou o token do Gateway
salvo no iPhone. Após o pareamento, o relógio armazena seu próprio token de dispositivo e
exclui a credencial de inicialização. O modo direto abrange apenas os comandos abaixo.
Chat, conversa, aprovações e o fluxo de notificações `watch.*` existente continuam sendo
recursos retransmitidos pelo iPhone e ainda exigem o iPhone pareado.

Comandos diretos do Node no watchOS:

| Superfície    | Comandos                       | Observações                                                  |
| ------------- | ------------------------------ | ------------------------------------------------------------ |
| Dispositivo   | `device.info`, `device.status` | Identidade, bateria, estado térmico, armazenamento e rede do Watch. |
| Notificações  | `system.notify`                | Enquanto o aplicativo estiver ativo; exige permissão no Watch.     |

O watchOS não expõe o WebKit a aplicativos de terceiros; portanto, o Node direto do relógio
não anuncia comandos do Canvas.

## Push baseado em retransmissão para compilações oficiais

As compilações oficiais distribuídas do iOS usam uma retransmissão externa de push, em vez de publicar o token bruto do APNs no Gateway. As compilações oficiais da App Store provenientes do canal público de versões usam a retransmissão hospedada em `https://ios-push-relay.openclaw.ai`; essa URL base é incorporada à distribuição na App Store e não lê nenhuma substituição.

Implantações de retransmissão personalizadas exigem um caminho de compilação/implantação do iOS deliberadamente separado cuja URL de retransmissão corresponda à URL de retransmissão do Gateway. O canal de versões da App Store nunca aceita uma URL de retransmissão personalizada. Se você estiver usando uma compilação com retransmissão personalizada, defina a URL de retransmissão correspondente no Gateway:

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

- O aplicativo para iOS se registra na retransmissão usando o App Attest e um JWS de transação do aplicativo do StoreKit.
- A retransmissão retorna um identificador opaco de retransmissão e uma concessão de envio com escopo de registro.
- O aplicativo para iOS obtém a identidade do Gateway pareado (`gateway.identity.get`) e a inclui no registro de retransmissão; assim, o registro baseado em retransmissão é delegado a esse Gateway específico.
- O aplicativo encaminha esse registro baseado em retransmissão ao Gateway pareado com `push.apns.register`.
- O Gateway usa o identificador de retransmissão armazenado para `push.test`, ativações em segundo plano e estímulos de ativação.
- Se posteriormente o aplicativo se conectar a outro Gateway ou a uma compilação com outra URL base de retransmissão, ele atualizará o registro de retransmissão, em vez de reutilizar a vinculação antiga.

O que o Gateway **não** precisa para esse caminho: nenhum token de retransmissão para toda a implantação nem uma chave direta do APNs para envios oficiais da App Store baseados em retransmissão.

Fluxo esperado do operador:

1. Instale o aplicativo oficial para iOS.
2. Opcional: defina `gateway.push.apns.relay.baseUrl` no Gateway somente ao usar uma compilação personalizada de retransmissão deliberadamente separada.
3. Pareie o aplicativo com o Gateway e deixe que ele conclua a conexão.
4. O aplicativo publica `push.apns.register` assim que tiver um token do APNs, a sessão do operador estiver conectada e o registro de retransmissão for concluído com sucesso.
5. Depois disso, `push.test`, ativações para reconexão e estímulos de ativação poderão usar o registro armazenado baseado em retransmissão.

## Sinalizadores periódicos de atividade em segundo plano

Quando o iOS desperta o aplicativo para uma notificação push silenciosa, uma atualização em segundo plano ou um evento de mudança significativa de localização, o aplicativo tenta uma breve reconexão do Node e então chama `node.event` com `event: "node.presence.alive"`. O Gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo pareado somente depois que a identidade autenticada do dispositivo Node é conhecida.

O aplicativo considera um despertar em segundo plano registrado com êxito somente quando a resposta do Gateway inclui `handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é compatível, mas não conta como uma atualização durável da última atividade.

Nota de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma substituição temporária por variável de ambiente para o Gateway (`gateway.push.apns.relay.baseUrl` é o caminho que prioriza a configuração).
- O modo de push da compilação de lançamento da App Store fixa no código o host do relay hospedado e nunca lê uma substituição da URL do relay — a variável de ambiente de compilação `OPENCLAW_PUSH_RELAY_BASE_URL` afeta somente os modos de compilação local/sandbox do iOS.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que o uso direto do APNs no Gateway não pode oferecer para compilações oficiais do iOS:

- Somente compilações genuínas do OpenClaw para iOS distribuídas pela Apple podem usar o relay hospedado.
- Um Gateway pode enviar notificações push por meio do relay somente para dispositivos iOS pareados com esse Gateway específico.

Etapa por etapa:

1. `iOS app -> gateway`: o aplicativo é pareado com o Gateway por meio do fluxo normal de autenticação do Gateway, o que lhe concede uma sessão autenticada de Node e uma sessão autenticada de operador. A sessão do operador chama `gateway.identity.get`.
2. `iOS app -> relay`: o aplicativo chama os endpoints de registro do relay por HTTPS com uma comprovação do App Attest e um JWS de transação do aplicativo do StoreKit. O relay valida o ID do pacote, a comprovação do App Attest e a comprovação de distribuição da Apple, além de exigir o caminho de distribuição oficial/de produção — é isso que impede compilações locais do Xcode/de desenvolvimento de usarem o relay hospedado, pois uma compilação local não consegue atender à comprovação de distribuição oficial da Apple.
3. `gateway identity delegation`: antes do registro no relay, o aplicativo obtém a identidade do Gateway pareado por meio de `gateway.identity.get` e a inclui no payload de registro do relay. O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegada a essa identidade do Gateway.
4. `gateway -> relay`: o Gateway armazena o identificador de relay e a concessão de envio provenientes de `push.apns.register`. Em `push.test`, despertares de reconexão e sinais de despertar, o Gateway assina a solicitação de envio com sua própria identidade de dispositivo; o relay verifica tanto a concessão de envio armazenada quanto a assinatura do Gateway em relação à identidade delegada do Gateway fornecida no registro. Outro Gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.
5. `relay -> APNs`: o relay possui as credenciais de produção do APNs e o token bruto do APNs para a compilação oficial. O Gateway nunca armazena o token bruto do APNs para compilações oficiais que usam o relay; o relay envia a notificação push final ao APNs em nome do Gateway pareado.

Por que esse design foi criado: para manter as credenciais de produção do APNs fora dos Gateways dos usuários, evitar o armazenamento de tokens brutos do APNs de compilações oficiais no Gateway, permitir o uso do relay hospedado somente por compilações oficiais do OpenClaw para iOS e impedir que um Gateway envie notificações push de despertar para dispositivos iOS pertencentes a outro Gateway.

Compilações locais/manuais continuam usando o APNs diretamente. Se você estiver testando essas compilações sem o relay, o Gateway ainda precisará de credenciais diretas do APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de execução do host do Gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena somente dados de autenticação do App Store Connect, como `APP_STORE_CONNECT_KEY_ID` e `APP_STORE_CONNECT_ISSUER_ID`; ele não configura a entrega direta pelo APNs para compilações locais do iOS.

Armazenamento recomendado no host do Gateway, consistente com outras credenciais de provedores em `~/.openclaw/credentials/`:

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

O aplicativo para iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente por meio de `local.`; a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo: `openclaw.internal.`) e o DNS dividido do Tailscale. Consulte [Bonjour](/pt-BR/gateway/bonjour) para ver o exemplo do CoreDNS.

### Host/porta manual

Em Settings, ative **Manual Host** e insira o host + porta do Gateway (padrão `18789`).

## Vários Gateways

O aplicativo mantém um registro de todos os Gateways com os quais foi pareado, para que você possa alternar entre eles sem repetir o pareamento:

- **Settings -> Gateway** exibe uma lista **Paired Gateways** com o Gateway ativo marcado. Toque em uma entrada para alternar; o aplicativo encerra as sessões atuais e se reconecta ao Gateway selecionado. Um menu de troca rápida aparece ao lado da linha de conexão quando há mais de um Gateway pareado.
- Credenciais, decisões de confiança TLS, preferências específicas de cada Gateway e histórico de conversas em cache são armazenados por Gateway. A alternância nunca mistura estados entre Gateways, e o registro de push acompanha o Gateway ativo.
- Deslize um Gateway pareado (ou use seu menu de contexto) para **Forget** e remover suas credenciais, tokens de dispositivo, pin TLS e conversas em cache.
- Gateways descobertos precisam estar visíveis na rede para que você possa alternar para eles; Gateways manuais se reconectam pelo host e pela porta salvos.

## Canvas + A2UI

O Node do iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de canvas do Gateway disponibiliza `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` por meio do servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O Node do iOS mantém a estrutura integrada como visualização conectada padrão. `canvas.a2ui.push` e `canvas.a2ui.reset` usam a página A2UI incluída e pertencente ao aplicativo.
- Páginas A2UI remotas do Gateway são somente para renderização no iOS; ações de botões A2UI nativas são aceitas somente em páginas incluídas e pertencentes ao aplicativo.
- Retorne à estrutura integrada usando `canvas.navigate` e `{"url":""}`.

## Relação com o Computer Use

O aplicativo para iOS é uma superfície de Node móvel, não um backend do Codex Computer Use. O Codex Computer Use e o `cua-driver mcp` controlam um desktop macOS local por meio de ferramentas MCP; o aplicativo para iOS expõe recursos do iPhone por meio de comandos de Node do OpenClaw, como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Os agentes ainda podem operar o aplicativo para iOS por meio do OpenClaw invocando comandos de Node, mas essas chamadas passam pelo protocolo de Node do Gateway e seguem os limites de primeiro e segundo plano do iOS. Use [Codex Computer Use](/pt-BR/plugins/codex-computer-use) para controlar o desktop local e esta página para conhecer os recursos do Node do iOS.

### Avaliação/instantâneo do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Despertar por voz + modo de conversa

- O despertar por voz e o modo de conversa estão disponíveis em Settings.
- O Talk em tempo real da OpenAI usa WebRTC controlado pelo cliente quando `talk.realtime.transport` é `webrtc`; uma configuração explícita de `gateway-relay` continua sob controle do Gateway. Consulte [Modo Talk](/pt-BR/nodes/talk).
- Nodes iOS compatíveis com Talk anunciam o recurso `talk` e podem declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`; por padrão, o Gateway permite esses comandos push-to-talk para Nodes confiáveis compatíveis com Talk.
- O iOS pode suspender o áudio em segundo plano; considere os recursos de voz como sujeitos a limitações quando o aplicativo não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o aplicativo para iOS para o primeiro plano (os comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_UNAVAILABLE`: não foi possível acessar a página A2UI incluída no WebView do aplicativo; mantenha o aplicativo em primeiro plano na aba Screen e tente novamente.
- A solicitação de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- O Watch não exibe o estado do iPhone: confirme se o iPhone informa `watchPaired: true`
  e `watchAppInstalled: true` em `watch.status`. Se o pareamento for falso, pareie o
  Watch no aplicativo Watch da Apple. Se a instalação for falsa, instale o aplicativo complementar
  em **My Watch -> Available Apps**. Após qualquer uma das alterações, abra o OpenClaw no
  Watch uma vez; a acessibilidade imediata ainda exige que ambos os aplicativos estejam em execução,
  enquanto atualizações enfileiradas podem chegar posteriormente em segundo plano.
- A reconexão falha após a reinstalação: o token de pareamento do Keychain foi apagado; pareie novamente o Node.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
