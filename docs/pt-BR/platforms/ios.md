---
read_when:
    - Emparelhamento ou reconexão do Node iOS
    - Ativação ou solução de problemas do Node direto do Apple Watch
    - Executando o aplicativo iOS a partir do código-fonte
    - Depuração da descoberta do Gateway ou dos comandos do canvas
summary: 'Aplicativo Node para iOS: conexão com o Gateway, emparelhamento, canvas e solução de problemas'
title: Aplicativo para iOS
x-i18n:
    generated_at: "2026-07-16T12:40:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Disponibilidade: as compilações do app para iPhone são distribuídas pelos canais da Apple quando habilitadas para uma versão. As compilações de desenvolvimento local também podem ser executadas a partir do código-fonte.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Disponibiliza recursos do Node: Canvas, captura de tela, captura da câmera, localização, modo de conversa, ativação por voz e resumos de Saúde opcionais.
- Recebe comandos `node.invoke` e relata eventos de status do Node.
- Permite navegar, em modo somente leitura, pelo espaço de trabalho do agente selecionado na superfície Agentes (Arquivos): navegação hierárquica por diretórios, pré-visualizações de texto com realce de sintaxe, pré-visualizações de imagens e exportação pela folha de compartilhamento. Não há operações de gravação; o Gateway limita o tamanho das pré-visualizações.
- Mantém um pequeno cache offline somente leitura das sessões e transcrições recentes de chat para cada Gateway pareado: inicializações a frio exibem imediatamente a última transcrição conhecida e a atualizam assim que o Gateway responde, os chats recentes continuam disponíveis para navegação enquanto não há conexão e redefinir/esquecer elimina o cache local protegido.
- Enfileira mensagens de texto enviadas enquanto não há conexão em uma caixa de saída durável por Gateway (até 50): os balões enfileirados aparecem na transcrição, são enviados em ordem após a reconexão com novas tentativas idempotentes, permanecem armazenados até que o histórico canônico confirme o envio, repetem a tentativa com recuo antes de exibir uma ação para tentar novamente/excluir e expiram em vez de serem enviados após 48 horas offline; redefinir/esquecer limpa a fila junto com o cache.
- Reproduz mensagens do assistente por voz sob demanda: mantenha pressionada uma mensagem no Chat e escolha **Ouvir**. O app reproduz clipes `tts.speak` compatíveis do Gateway com o provedor de TTS configurado e usa a fala no dispositivo como alternativa quando o áudio do Gateway está indisponível ou não pode ser reproduzido. A reprodução é interrompida ao trocar de sessão ou colocar o app em segundo plano.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (alternativa).

## Início rápido (parear + conectar)

Na primeira inicialização, o app apresenta uma breve explicação sobre o pareamento e uma
página de permissões (notificações, câmera, microfone, fotos, contatos,
calendário, lembretes e localização). Todas as concessões são opcionais e podem ser alteradas
posteriormente em **Ajustes** -> **Permissões** ou no app Ajustes do iOS.

1. Inicie um Gateway autenticado com uma rota acessível pelo telefone. O Tailscale
   Serve é o caminho remoto recomendado:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Para uma configuração confiável na mesma LAN, use um `gateway.bind: "lan"` autenticado
como alternativa. O vínculo padrão com loopback não pode ser acessado por um telefone. Se o
Gateway ainda não tiver sido configurado, execute `openclaw onboard` primeiro para que a criação
do código de configuração tenha um caminho de autenticação por token ou senha.

2. Abra a [IU de controle](/pt-BR/web/control-ui), selecione **Nós** e clique em
   **Parear dispositivo móvel** na página **Dispositivos**. O acesso completo é recomendado
   e vem selecionado por padrão; escolha Acesso limitado somente quando quiser omitir
   os controles administrativos do Gateway e clique em **Criar código de configuração**.

3. No app para iOS, abra **Ajustes** -> **Gateway**, escaneie o código QR (ou cole
   o código de configuração) e conecte-se.

   Se o código de configuração contiver rotas de LAN e do Tailscale Serve, o app
   as testa em ordem e salva o primeiro endpoint acessível.

4. O app oficial conecta-se automaticamente. Se **Aprovação pendente** exibir uma
   solicitação, revise a função e os escopos antes de aprová-la.

   **Ajustes → Gateway** mostra se a conexão de operador salva tem acesso
   **Completo** ou **Limitado**. A configuração de LAN em texto simples `ws://` é automaticamente
   limitada para proteger o token ao portador. Se estiver limitada, configure `wss://` ou
   o Tailscale Serve, escaneie um novo código de acesso completo na IU de controle ou em `openclaw qr`
   e reconecte-se para habilitar ajustes e atualizações.

O botão da IU de controle exige uma sessão já pareada com `operator.admin`.
Como alternativa pelo terminal, escolha um Gateway descoberto no app para iOS (ou habilite
Host manual e insira o host/a porta) e aprove a solicitação no host do Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública), a solicitação pendente anterior será substituída e um novo `requestId` será criado. Execute `openclaw devices list` novamente antes da aprovação.

Opcional: se o Node do iOS sempre se conectar a partir de uma sub-rede rigorosamente controlada, é possível habilitar a aprovação automática do Node no primeiro pareamento usando CIDRs explícitos ou IPs exatos:

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

Esse recurso vem desabilitado por padrão. Ele se aplica apenas a pareamentos `role: node` novos sem escopos solicitados. O pareamento de operador/navegador e qualquer alteração de função, escopo, metadados ou chave pública ainda exigem aprovação manual.

5. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Resumos de Saúde

O Node do iOS pode retornar, mediante adesão, um agregado somente leitura do HealthKit referente ao
dia atual do calendário. O consentimento no iPhone e a autorização explícita de comandos do Gateway são
controles independentes. Consulte [Resumos do HealthKit](/platforms/ios-healthkit) para obter informações sobre
configuração, invocação, campos da carga útil, comportamento de privacidade e solução de problemas.

Por padrão, o app complementar do Apple Watch continua usando o relay existente do iPhone e
não precisa de um pareamento separado com o Gateway. Pareie o Watch com o iPhone no
app Watch da Apple, instale o OpenClaw em **Watch app -> My Watch -> Available
Apps** e abra o OpenClaw uma vez em ambos os dispositivos.

## Revisar aprovações de comandos

Uma conexão de operador com `operator.admin` ou uma conexão
`operator.approvals` pareada e explicitamente direcionada pelo Gateway pode revisar
solicitações de execução pendentes no iPhone. O cartão de aprovação mostra a
prévia sanitizada do comando pelo Gateway, o aviso, o contexto do host, a expiração e somente as
decisões oferecidas por essa solicitação. O Apple Watch pareado recebe a mesma
solicitação segura para o revisor pelo relay existente do iPhone e oferece o subconjunto compacto
de decisões para permitir uma vez/negar. O modo direto do Gateway no Watch não transmite
solicitações de aprovação.

O estado da aprovação é compartilhado com a IU de controle e as superfícies de chat compatíveis. A
primeira resposta confirmada prevalece. O iPhone e o Watch buscam o registro terminal canônico
do Gateway depois que outra superfície resolve a solicitação, após uma notificação remota
de resolução e sempre que uma confirmação de resolução puder ter sido
perdida. As ações permanecem indisponíveis até que essa releitura confirme se a
solicitação continua pendente.

A propriedade da aprovação está vinculada ao Gateway selecionado. A troca de Gateways não pode
aplicar uma solicitação antiga à conexão substituta. Gateways anteriores aos
métodos unificados de aprovação usam como alternativa os métodos específicos de execução já distribuídos;
o estado terminal preservado e resultados mais completos entre superfícies exigem um
Gateway atualizado.

## Node direto opcional no Apple Watch

O modo direto fornece ao Watch sua própria identidade assinada de Node e conexão com o Gateway.
Os comandos de Node compatíveis continuam funcionando por Wi-Fi ou rede celular no Watch enquanto
o OpenClaw está ativo, mesmo quando o iPhone pareado está indisponível.

Requisitos:

- O iPhone está conectado ao Gateway com o escopo `operator.admin`.
- O código de configuração anuncia um endpoint de Gateway `wss://` com um certificado considerado confiável
  pelo watchOS; o Watch consulta periodicamente a origem `https://` correspondente. HTTP sem criptografia e
  certificados autoassinados ou confiança baseada apenas em impressão digital não são compatíveis. Consulte [Pareamento
  controlado pelo Gateway](/pt-BR/gateway/pairing) para configurar o endpoint. Rotas de loopback, exclusivas do iPhone
  e exclusivas da tailnet não podem ser acessadas de forma independente pelo Watch.
- O uso de rede celular exige um Apple Watch compatível com rede celular e serviço ativo.
- O OpenClaw está ativo no Watch. A Apple não permite que apps comuns do watchOS
  mantenham conexões WebSocket/TCP genéricas; portanto, o Node direto usa consultas HTTPS
  curtas e se reconecta quando o app retorna ao primeiro plano. Consulte as
  [orientações da Apple sobre redes de baixo nível no watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Configuração:

1. No iPhone, abra **Ajustes -> Apple Watch**.
2. Toque em **Habilitar conexão direta com o Gateway**.
3. Abra o OpenClaw no Watch antes que o código de configuração de curta duração expire.
4. Verifique a linha separada do Apple Watch com `openclaw nodes status`.

O código de configuração contém uma credencial de inicialização de curta duração exclusiva do Node; trate-a
como uma senha até que expire. Ele nunca contém a senha ou o token
do Gateway salvo no iPhone. Após o pareamento, o Watch armazena seu próprio token de dispositivo e
exclui a credencial de inicialização. O modo direto abrange somente os comandos abaixo.
Chat, Conversa, aprovações e o fluxo de notificações `watch.*` existente continuam sendo
recursos de relay do iPhone e ainda exigem o iPhone pareado.

Comandos diretos do Node no watchOS:

| Superfície     | Comandos                       | Observações                                                |
| -------------- | ------------------------------ | ---------------------------------------------------------- |
| Dispositivo    | `device.info`, `device.status` | Identidade, bateria, temperatura, armazenamento e rede do Watch. |
| Notificações   | `system.notify`                | Enquanto o app está ativo; exige permissão no Watch.       |

O watchOS não disponibiliza o WebKit para apps de terceiros; portanto, o Node direto do Watch
não anuncia comandos do Canvas.

## Push com suporte de relay para compilações oficiais

As compilações oficiais distribuídas para iOS usam um relay de push externo em vez de publicar o token bruto do APNs no Gateway. As compilações oficiais da App Store provenientes do fluxo público de lançamento usam o relay hospedado em `https://ios-push-relay.openclaw.ai`; essa URL base é codificada diretamente para distribuição na App Store e não lê nenhuma substituição.

Implantações de relay personalizadas exigem um caminho de compilação/implantação do iOS deliberadamente separado, cuja URL do relay corresponda à URL do relay do Gateway. O fluxo de lançamento da App Store nunca aceita uma URL de relay personalizada. Se estiver usando uma compilação com relay personalizado, defina a URL correspondente do relay no Gateway:

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

- O app para iOS registra-se no relay usando App Attest e um JWS de transação do app do StoreKit.
- O relay retorna um identificador opaco de relay e uma concessão de envio limitada ao registro.
- O app para iOS busca a identidade do Gateway pareado (`gateway.identity.get`) e a inclui no registro do relay, de modo que o registro com suporte de relay seja delegado a esse Gateway específico.
- O app encaminha esse registro com suporte de relay ao Gateway pareado usando `push.apns.register`.
- O Gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e sinais de ativação.
- Se posteriormente o app se conectar a outro Gateway ou a uma compilação com uma URL base de relay diferente, ele atualizará o registro do relay em vez de reutilizar a associação antiga.

O que o Gateway **não** precisa para esse caminho: nenhum token de relay válido para toda a implantação e nenhuma chave direta do APNs para envios oficiais da App Store com suporte de relay.

Fluxo esperado para o operador:

1. Instale o app oficial para iOS.
2. Opcional: defina `gateway.push.apns.relay.baseUrl` no Gateway somente ao usar uma compilação de relay personalizada e deliberadamente separada.
3. Pareie o app com o Gateway e aguarde até que ele conclua a conexão.
4. O app publica `push.apns.register` assim que obtém um token do APNs, a sessão do operador está conectada e o registro do relay é concluído.
5. Depois disso, `push.test`, ativações de reconexão e sinais de ativação podem usar o registro armazenado com suporte de relay.

## Sinalizadores de atividade em segundo plano

Quando o iOS desperta o aplicativo para uma notificação push silenciosa, atualização em segundo plano ou evento de mudança significativa de localização, o aplicativo tenta uma breve reconexão do Node e, em seguida, chama `node.event` com `event: "node.presence.alive"`. O Gateway registra isso como `lastSeenAtMs`/`lastSeenReason` nos metadados do Node/dispositivo emparelhado somente depois que a identidade autenticada do dispositivo Node é conhecida.

O aplicativo considera que um despertar em segundo plano foi registrado com sucesso somente quando a resposta do Gateway inclui `handled: true`. Gateways mais antigos podem confirmar `node.event` com `{ "ok": true }`; essa resposta é compatível, mas não conta como uma atualização persistente da última vez em que o dispositivo foi visto.

Observação sobre compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como uma substituição temporária por variável de ambiente para o Gateway (`gateway.push.apns.relay.baseUrl` é o caminho que prioriza a configuração).
- O modo de push da compilação de lançamento da App Store fixa no código o host do relay hospedado e nunca lê uma substituição da URL do relay — a variável de ambiente de tempo de compilação `OPENCLAW_PUSH_RELAY_BASE_URL` afeta somente os modos de compilação local/sandbox do iOS.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que o uso direto do APNs no Gateway não pode oferecer para compilações oficiais do iOS:

- Somente compilações genuínas do OpenClaw para iOS distribuídas pela Apple podem usar o relay hospedado.
- Um Gateway pode enviar notificações push por meio do relay somente para dispositivos iOS emparelhados com esse Gateway específico.

Etapa por etapa:

1. `iOS app -> gateway`: o aplicativo é emparelhado com o Gateway pelo fluxo normal de autenticação do Gateway, que fornece uma sessão autenticada do Node e uma sessão autenticada do operador. A sessão do operador chama `gateway.identity.get`.
2. `iOS app -> relay`: o aplicativo chama os endpoints de registro do relay por HTTPS com uma comprovação do App Attest e um JWS de transação do aplicativo do StoreKit. O relay valida o ID do pacote, a comprovação do App Attest e a comprovação de distribuição da Apple, além de exigir o caminho de distribuição oficial/de produção — isso impede que compilações locais do Xcode/de desenvolvimento usem o relay hospedado, pois uma compilação local não pode fornecer a comprovação oficial de distribuição da Apple.
3. `gateway identity delegation`: antes do registro no relay, o aplicativo busca a identidade do Gateway emparelhado em `gateway.identity.get` e a inclui na carga de registro do relay. O relay retorna um identificador de relay e uma concessão de envio com escopo de registro delegada a essa identidade do Gateway.
4. `gateway -> relay`: o Gateway armazena o identificador do relay e a concessão de envio de `push.apns.register`. Em `push.test`, despertares de reconexão e estímulos de despertar, o Gateway assina a solicitação de envio com sua própria identidade de dispositivo; o relay verifica tanto a concessão de envio armazenada quanto a assinatura do Gateway em relação à identidade delegada do Gateway definida no registro. Outro Gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.
5. `relay -> APNs`: o relay mantém as credenciais de produção do APNs e o token bruto do APNs para a compilação oficial. O Gateway nunca armazena o token bruto do APNs para compilações oficiais que usam o relay; o relay envia a notificação push final ao APNs em nome do Gateway emparelhado.

Motivo da criação desse design: manter as credenciais de produção do APNs fora dos Gateways dos usuários, evitar o armazenamento de tokens brutos do APNs de compilações oficiais no Gateway, permitir o uso do relay hospedado somente por compilações oficiais do OpenClaw para iOS e impedir que um Gateway envie notificações push de despertar para dispositivos iOS pertencentes a outro Gateway.

Compilações locais/manuais continuam usando o APNs diretamente. Se essas compilações estiverem sendo testadas sem o relay, o Gateway ainda precisará de credenciais diretas do APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do Gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena somente a autenticação do App Store Connect, como `APP_STORE_CONNECT_KEY_ID` e `APP_STORE_CONNECT_ISSUER_ID`; ele não configura a entrega direta pelo APNs para compilações locais do iOS.

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

O aplicativo para iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo domínio de descoberta DNS-SD de longa distância. Gateways na mesma LAN aparecem automaticamente por meio de `local.`; a descoberta entre redes pode usar o domínio de longa distância configurado sem alterar o tipo de sinalizador.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo: `openclaw.internal.`) e o DNS dividido do Tailscale. Consulte [Bonjour](/pt-BR/gateway/bonjour) para ver o exemplo do CoreDNS.

### Host/porta manual

Em Settings, habilite **Manual Host** e insira o host + a porta do Gateway (padrão `18789`).

## Vários Gateways

O aplicativo mantém um registro de todos os Gateways com os quais foi emparelhado, permitindo alternar entre eles sem repetir o emparelhamento:

- **Settings -> Gateway** exibe uma lista **Paired Gateways** com o Gateway ativo marcado. Toque em uma entrada para alternar; o aplicativo encerra as sessões atuais e se reconecta ao Gateway selecionado. Um menu de troca rápida aparece ao lado da linha de conexão quando há mais de um Gateway emparelhado.
- Credenciais, decisões de confiança de TLS, preferências específicas de cada Gateway e histórico de conversas em cache são armazenados por Gateway. A alternância nunca mistura estados entre Gateways, e o registro de push acompanha o Gateway ativo.
- Deslize um Gateway emparelhado (ou use o menu de contexto) para **Forget**, removendo suas credenciais, tokens de dispositivo, pin de TLS e conversas em cache.
- Gateways descobertos precisam estar visíveis na rede para que seja possível alternar para eles; Gateways manuais se reconectam usando o host e a porta salvos.

## Canvas + A2UI

O Node do iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host do canvas do Gateway disponibiliza `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` por meio do servidor HTTP do Gateway (mesma porta que `gateway.port`, padrão `18789`).
- O Node do iOS mantém a estrutura integrada como visualização conectada padrão. `canvas.a2ui.push` e `canvas.a2ui.reset` usam a página A2UI incluída e pertencente ao aplicativo.
- As páginas A2UI remotas do Gateway são somente para renderização no iOS; ações nativas de botões A2UI são aceitas somente de páginas incluídas e pertencentes ao aplicativo.
- Retorne à estrutura integrada com `canvas.navigate` e `{"url":""}`.

## Relação com o Computer Use

O aplicativo para iOS é uma superfície móvel de Node, não um backend do Codex Computer Use. O Codex Computer Use e `cua-driver mcp` controlam um desktop macOS local por meio de ferramentas MCP; o aplicativo para iOS expõe recursos do iPhone por meio de comandos de Node do OpenClaw, como `canvas.*`, `camera.*`, `screen.*`, `location.*` e `talk.*`.

Os agentes ainda podem operar o aplicativo para iOS por meio do OpenClaw invocando comandos do Node, mas essas chamadas passam pelo protocolo de Node do Gateway e seguem os limites de primeiro/segundo plano do iOS. Use [Codex Computer Use](/pt-BR/plugins/codex-computer-use) para controlar o desktop local e esta página para consultar os recursos do Node do iOS.

### Avaliação / snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo de conversa

- A ativação por voz e o modo de conversa estão disponíveis em Settings.
- O Talk em tempo real da OpenAI usa WebRTC controlado pelo cliente quando `talk.realtime.transport` é `webrtc`; uma configuração explícita de `gateway-relay` continua sendo controlada pelo Gateway. Consulte [Modo Talk](/pt-BR/nodes/talk).
- Nodes do iOS compatíveis com Talk anunciam o recurso `talk` e podem declarar `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` e `talk.ptt.once`; por padrão, o Gateway permite esses comandos de pressionar para falar para Nodes confiáveis compatíveis com Talk.
- O iOS pode suspender o áudio em segundo plano; considere os recursos de voz como de melhor esforço quando o aplicativo não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: coloque o aplicativo para iOS em primeiro plano (os comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_UNAVAILABLE`: a página A2UI incluída não estava acessível na WebView do aplicativo; mantenha o aplicativo em primeiro plano na aba Screen e tente novamente.
- A solicitação de emparelhamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- O Watch não mostra o estado do iPhone: confirme se o iPhone informa `watchPaired: true`
  e `watchAppInstalled: true` em `watch.status`. Se o emparelhamento for falso, emparelhe o
  Watch no aplicativo Watch da Apple. Se a instalação for falsa, instale o aplicativo complementar
  em **My Watch -> Available Apps**. Após qualquer uma dessas alterações, abra o OpenClaw no
  Watch uma vez; a acessibilidade imediata ainda exige que os dois aplicativos estejam em execução,
  enquanto atualizações enfileiradas podem chegar posteriormente em segundo plano.
- A reconexão falha após a reinstalação: o token de emparelhamento do Keychain foi apagado; emparelhe o Node novamente.

## Documentação relacionada

- [Emparelhamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
