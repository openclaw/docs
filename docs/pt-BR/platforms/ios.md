---
read_when:
    - Fazendo pairing ou reconectando o node do iOS
    - Executando o app iOS a partir do código-fonte
    - Depurando descoberta do gateway ou comandos do canvas
summary: 'App de node para iOS: conectar ao Gateway, pairing, canvas e solução de problemas'
title: App iOS
x-i18n:
    generated_at: "2026-04-24T06:00:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87eaa706993bec9434bf22e18022af711b8398efff11c7fba4887aba46041ed3
    source_path: platforms/ios.md
    workflow: 15
---

Disponibilidade: prévia interna. O app iOS ainda não é distribuído publicamente.

## O que ele faz

- Conecta-se a um Gateway por WebSocket (LAN ou tailnet).
- Expõe capacidades de node: Canvas, snapshot de tela, captura de câmera, localização, modo Talk, ativação por voz.
- Recebe comandos `node.invoke` e informa eventos de status do node.

## Requisitos

- Gateway em execução em outro dispositivo (macOS, Linux ou Windows via WSL2).
- Caminho de rede:
  - Mesma LAN via Bonjour, **ou**
  - Tailnet via DNS-SD unicast (domínio de exemplo: `openclaw.internal.`), **ou**
  - Host/porta manual (fallback).

## Início rápido (pair + connect)

1. Inicie o Gateway:

```bash
openclaw gateway --port 18789
```

2. No app iOS, abra Settings e escolha um gateway descoberto (ou habilite Manual Host e informe host/porta).

3. Aprove a solicitação de pairing no host do gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Se o app tentar novamente o pairing com detalhes de autenticação alterados (papel/escopos/chave pública),
a solicitação pendente anterior será substituída e um novo `requestId` será criado.
Execute `openclaw devices list` novamente antes de aprovar.

4. Verifique a conexão:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push com relay para builds oficiais

Builds iOS oficiais distribuídos usam o relay push externo em vez de publicar o token APNs bruto
para o gateway.

Requisito do lado do gateway:

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

- O app iOS registra-se no relay usando App Attest e o recibo do app.
- O relay retorna um identificador opaco de relay mais uma concessão de envio restrita ao escopo do registro.
- O app iOS busca a identidade do gateway emparelhado e a inclui no registro do relay, de modo que o registro com suporte de relay seja delegado a esse gateway específico.
- O app encaminha esse registro com suporte de relay ao gateway emparelhado com `push.apns.register`.
- O gateway usa esse identificador de relay armazenado para `push.test`, ativações em segundo plano e nudges de ativação.
- A base URL do relay no gateway deve corresponder à URL do relay incorporada no build iOS oficial/TestFlight.
- Se o app se conectar depois a um gateway diferente ou a um build com uma base URL de relay diferente, ele atualiza o registro do relay em vez de reutilizar o vínculo antigo.

O que o gateway **não** precisa para esse caminho:

- Nenhum token de relay válido para toda a implantação.
- Nenhuma chave APNs direta para envios com suporte de relay em builds oficiais/TestFlight.

Fluxo esperado do operador:

1. Instale o build iOS oficial/TestFlight.
2. Defina `gateway.push.apns.relay.baseUrl` no gateway.
3. Faça o pairing do app com o gateway e deixe-o concluir a conexão.
4. O app publica `push.apns.register` automaticamente depois que já tiver um token APNs, a sessão do operador estiver conectada e o registro no relay tiver sido bem-sucedido.
5. Depois disso, `push.test`, ativações de reconexão e nudges de ativação poderão usar o registro armazenado com suporte de relay.

Observação de compatibilidade:

- `OPENCLAW_APNS_RELAY_BASE_URL` ainda funciona como substituição temporária por variável de ambiente para o gateway.

## Autenticação e fluxo de confiança

O relay existe para impor duas restrições que APNs direto no gateway não consegue fornecer para
builds iOS oficiais:

- Somente builds iOS genuínos do OpenClaw distribuídos pela Apple podem usar o relay hospedado.
- Um gateway só pode enviar pushes com suporte de relay para dispositivos iOS que fizeram pairing com esse gateway específico.

Salto por salto:

1. `app iOS -> gateway`
   - O app primeiro faz pairing com o gateway pelo fluxo normal de autenticação do Gateway.
   - Isso dá ao app uma sessão de node autenticada mais uma sessão autenticada de operador.
   - A sessão do operador é usada para chamar `gateway.identity.get`.

2. `app iOS -> relay`
   - O app chama os endpoints de registro do relay por HTTPS.
   - O registro inclui prova de App Attest mais o recibo do app.
   - O relay valida o bundle ID, a prova de App Attest e o recibo Apple, e exige o
     caminho oficial/de produção de distribuição.
   - É isso que impede builds locais Xcode/dev de usar o relay hospedado. Um build local pode estar
     assinado, mas não satisfaz a prova oficial de distribuição Apple que o relay espera.

3. `delegação de identidade do gateway`
   - Antes do registro no relay, o app busca a identidade do gateway emparelhado em
     `gateway.identity.get`.
   - O app inclui essa identidade do gateway na carga útil de registro do relay.
   - O relay retorna um identificador de relay e uma concessão de envio restrita ao escopo do registro que são delegados
     a essa identidade de gateway.

4. `gateway -> relay`
   - O gateway armazena o identificador de relay e a concessão de envio vindos de `push.apns.register`.
   - Em `push.test`, ativações de reconexão e nudges de ativação, o gateway assina a solicitação de envio com sua
     própria identidade de dispositivo.
   - O relay verifica tanto a concessão de envio armazenada quanto a assinatura do gateway em relação à identidade
     de gateway delegada no registro.
   - Outro gateway não pode reutilizar esse registro armazenado, mesmo que de alguma forma obtenha o identificador.

5. `relay -> APNs`
   - O relay é o proprietário das credenciais de produção APNs e do token APNs bruto para o build oficial.
   - O gateway nunca armazena o token APNs bruto para builds oficiais com suporte de relay.
   - O relay envia o push final ao APNs em nome do gateway emparelhado.

Por que esse design foi criado:

- Para manter credenciais de produção APNs fora dos gateways dos usuários.
- Para evitar armazenar tokens APNs brutos de builds oficiais no gateway.
- Para permitir o uso do relay hospedado somente para builds oficiais/TestFlight do OpenClaw.
- Para impedir que um gateway envie pushes de ativação para dispositivos iOS pertencentes a outro gateway.

Builds locais/manuais continuam usando APNs direto. Se você estiver testando esses builds sem o relay, o
gateway ainda precisará de credenciais APNs diretas:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Essas são variáveis de ambiente de runtime do host do gateway, não configurações do Fastlane. `apps/ios/fastlane/.env` armazena apenas
autenticação App Store Connect / TestFlight, como `ASC_KEY_ID` e `ASC_ISSUER_ID`; ele não configura
entrega APNs direta para builds iOS locais.

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

O app iOS procura `_openclaw-gw._tcp` em `local.` e, quando configurado, no mesmo
domínio de descoberta DNS-SD de área ampla. Gateways na mesma LAN aparecem automaticamente a partir de `local.`; a descoberta entre redes pode usar o domínio de área ampla configurado sem mudar o tipo de beacon.

### Tailnet (entre redes)

Se mDNS estiver bloqueado, use uma zona DNS-SD unicast (escolha um domínio; exemplo:
`openclaw.internal.`) e Tailscale split DNS.
Consulte [Bonjour](/pt-BR/gateway/bonjour) para o exemplo com CoreDNS.

### Host/porta manual

Em Settings, habilite **Manual Host** e informe o host + porta do gateway (padrão `18789`).

## Canvas + A2UI

O node iOS renderiza um canvas WKWebView. Use `node.invoke` para controlá-lo:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Observações:

- O canvas host do Gateway serve `/__openclaw__/canvas/` e `/__openclaw__/a2ui/`.
- Ele é servido pelo servidor HTTP do Gateway (mesma porta de `gateway.port`, padrão `18789`).
- O node iOS navega automaticamente para A2UI ao conectar quando uma URL de canvas host é anunciada.
- Retorne para o scaffold integrado com `canvas.navigate` e `{"url":""}`.

### Avaliação / snapshot do canvas

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Ativação por voz + modo Talk

- Ativação por voz e modo Talk estão disponíveis em Settings.
- O iOS pode suspender áudio em segundo plano; trate os recursos de voz como em melhor esforço quando o app não estiver ativo.

## Erros comuns

- `NODE_BACKGROUND_UNAVAILABLE`: traga o app iOS para o primeiro plano (comandos de canvas/câmera/tela exigem isso).
- `A2UI_HOST_NOT_CONFIGURED`: o Gateway não anunciou uma URL de canvas host; verifique `canvasHost` em [Configuração do Gateway](/pt-BR/gateway/configuration).
- O prompt de pairing nunca aparece: execute `openclaw devices list` e aprove manualmente.
- A reconexão falha após reinstalação: o token de pairing do Keychain foi limpo; faça o pairing do node novamente.

## Documentação relacionada

- [Pairing](/pt-BR/channels/pairing)
- [Descoberta](/pt-BR/gateway/discovery)
- [Bonjour](/pt-BR/gateway/bonjour)
