---
read_when:
    - Pareando ou reconectando o nó do iOS
    - Executando o app para iOS a partir do código-fonte
    - Depurando descoberta de gateway ou comandos de canvas
summary: 'App de nó para iOS: conectar ao Gateway, pareamento, canvas e solução de problemas'
title: App para iOS
x-i18n:
    generated_at: "2026-04-07T05:28:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f3e0a6e33e72d4c9f1f17ef70a1b67bae9ebe4a2dca16677ea6b28d0ddac1b4e
    source_path: platforms/ios.md
    workflow: 15
---

# App para iOS (Nó)

Disponibilidade: visualização interna. O app para iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe capacidades de nó: Canvas, snapshot da tela, captura de câmera, localização, modo de conversa, ativação por voz.
- Recebe comandos `node.invoke` e relata eventos de status do nó.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (parear + conectar)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app para iOS, abra Settings e escolha um gateway descoberto (ou habilite Manual Host e insira host/porta).

3. Aprove a solicitação de pareamento no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar novamente o pareamento com detalhes de autenticação alterados (função/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes da aprovação.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds oficiais distribuídos do iOS usam o relay externo de push em vez de publicar o token bruto de APNs
para o gateway.

Requisito no lado do gateway:

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

- O app para iOS registra-se no relay usando App Attest e o recibo do app.
- O relay retorna um identificador opaco de relay junto com uma permissão de envio com escopo de registro.
- O app para iOS busca a identidade do gateway pareado e a inclui no registro do relay, para que o registro com relay seja delegado a esse gateway específico.
- O app encaminha esse registro com relay ao gateway pareado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e sinais de ativação.
- A URL base do relay no gateway deve corresponder à URL do relay incorporada no build oficial/TestFlight do iOS.
- Se o app depois se conectar a um gateway diferente ou a um build com uma URL base de relay diferente, ele atualiza o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay para toda a implantação.
- Nenhuma chave APNs direta para envios oficiais/TestFlight com relay.

Fluxo esperado para o operador:

1. Instale o build oficial/TestFlight do iOS.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Pareie o app com o gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois que tiver um token de APNs, a sessão do operador estiver conectada e o registro no relay for bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e sinais de ativação podem usar o registro com relay armazenado.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como substituição temporária via variável de ambiente para o gateway.

## Fluxo de autenticação e confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue oferecer para
builds oficiais de iOS:

- Apenas builds genuínos do OpenClaw para iOS distribuídos pela Apple podem usar o relay hospedado.
- Um gateway só pode enviar pushes com relay para dispositivos iOS que tenham sido pareados com esse gateway específico.

Salto por salto:

1. `app para iOS -> gateway`
   - O app primeiro pareia com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão autenticada de nó e uma sessão autenticada de operador.
   - A sessão de operador é usada para chamar `gateway.identity.get`.

2. `app para iOS -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova de App Attest e o recibo do app.
   - O relay valida o bundle ID, a prova de App Attest e o recibo da Apple, e exige o caminho de distribuição oficial/de produção.
   - É isso que impede builds locais de Xcode/dev de usarem o relay hospedado. Um build local pode ser
     assinado, mas não satisfaz a prova de distribuição oficial da Apple que o relay espera.

3. `delegação de identidade do gateway`
   - Antes do registro no relay, o app busca a identidade do gateway pareado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway na carga de registro do relay.
   - O relay retorna um identificador de relay e uma permissão de envio com escopo de registro delegados a
     essa identidade do gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a permissão de envio de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e sinais de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a permissão de envio armazenada quanto a assinatura do gateway em relação à identidade do
     gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay é o proprietário das credenciais de produção do APNs e do token bruto de APNs para o build oficial.
   - O gateway nunca armazena o token bruto de APNs para builds oficiais com relay.
   - O relay envia o push final ao APNs em nome do gateway pareado.

Por que esse design foi criado:

- Para manter credenciais de produção do APNs fora dos gateways dos usuários.
- Para evitar armazenar tokens brutos de APNs de builds oficiais no gateway.
- Para permitir o uso do relay hospedado apenas para builds oficiais/TestFlight do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais continuam usando APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisará de credenciais diretas de APNs:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação do App Store Connect / TestFlight, como `ASC_KEY_ID` e `ASC_ISSUER_ID`; ele não configura
a entrega direta por APNs para builds locais de iOS.

Armazenamento recomendado no host do gateway:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Não faça commit do arquivo `.p8` nem o coloque dentro do checkout do repositório.

## Caminhos de descoberta

### Bonjour (LAN)

O app para iOS navega em `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`;
a descoberta entre redes pode usar o domínio de área ampla configurado sem alterar o tipo de beacon.

### Tailnet (entre redes)

Se o mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e Tailscale split DNS.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para o exemplo com CoreDNS.

### Host/porta manual

Em Settings, habilite **Manual Host** e insira o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O nó do iOS renderiza um canvas em WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O host de canvas do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O nó do iOS navega automaticamente para A2UI ao conectar quando uma URL de host de canvas é anunciada.
- Volte ao scaffold interno com `canvas.navigate` e `{"url":""}`.

### Avaliação / snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo de conversa

- A ativação por voz e o modo de conversa estão disponíveis em Settings.
- O iOS pode suspender o áudio em segundo plano; trate os recursos de voz como melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app para iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de host de canvas; verifique `canvasHost` em [Configuração do Gateway](/pt-BR/gateway/configuration).
- O prompt de pareamento nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalação: o token de pareamento do Keychain foi limpo; pareie o nó novamente.

## Documentação relacionada

- [Pareamento](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
