---
doc-schema-version: 1
read_when:
    - Você quer criar um novo plugin do OpenClaw
    - Você precisa de um guia de início rápido para o desenvolvimento de plugins
    - Você está escolhendo entre a documentação de canal, provedor, backend de CLI, ferramenta ou hook
sidebarTitle: Getting Started
summary: Crie seu primeiro plugin do OpenClaw em minutos
title: Criando plugins
x-i18n:
    generated_at: "2026-07-12T15:27:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Os plugins estendem o OpenClaw sem alterar o núcleo. Um plugin pode adicionar um
canal de mensagens, provedor de modelos, backend de CLI local, ferramenta de agente, hook, provedor de mídia
ou outro recurso pertencente ao plugin.

Você não precisa adicionar um plugin externo ao repositório do OpenClaw. Publique
o pacote no [ClawHub](/pt-BR/clawhub), e os usuários poderão instalá-lo com:

```bash
openclaw plugins install clawhub:<package-name>
```

As especificações de pacote sem prefixo ainda são instaladas pelo npm durante a transição de lançamento. Use o
prefixo `clawhub:` quando quiser a resolução pelo ClawHub.

## Requisitos

- Node 22.19+, Node 23.11+ ou Node 24+, e `npm` ou `pnpm`.
- Módulos ESM em TypeScript.
- Para trabalhar em um plugin incluído no repositório, clone o repositório e execute `pnpm install`.
  O desenvolvimento de plugins a partir do checkout do código-fonte aceita somente pnpm, pois o OpenClaw descobre
  plugins incluídos por meio dos pacotes de workspace em `extensions/*`.

## Escolha o formato do plugin

<CardGroup cols={2}>
  <Card title="Plugin de canal" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Conecte o OpenClaw a uma plataforma de mensagens.
  </Card>
  <Card title="Plugin de provedor" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Adicione um provedor de modelos, mídia, pesquisa, busca, fala ou tempo real.
  </Card>
  <Card title="Plugin de backend de CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Execute uma CLI de IA local por meio do fallback de modelos do OpenClaw.
  </Card>
  <Card title="Plugin de ferramenta" icon="wrench" href="/pt-BR/plugins/tool-plugins">
    Registre ferramentas de agente.
  </Card>
</CardGroup>

## Início rápido

Crie um plugin de ferramenta mínimo registrando uma ferramenta de agente obrigatória. Esse é o
formato de plugin útil mais simples e abrange o pacote, o manifesto, o ponto de entrada e a
validação local.

<Steps>
  <Step title="Crie os metadados do pacote">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    Plugins externos publicados devem apontar as entradas de runtime para arquivos JavaScript
    compilados. Consulte [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) para ver o contrato completo de
    pontos de entrada.

    Todo plugin precisa de um manifesto, mesmo sem configuração. As ferramentas de runtime devem
    aparecer em `contracts.tools` para que o OpenClaw possa descobrir a propriedade sem
    carregar antecipadamente o runtime de cada plugin. Defina `activation.onStartup`
    intencionalmente; este exemplo é carregado na inicialização do Gateway.

    As superfícies de plugin confiáveis para o host também são controladas pelo manifesto e exigem
    declaração explícita para plugins instalados: `api.registerAgentToolResultMiddleware(...)`
    exige que cada runtime de destino esteja listado em `contracts.agentToolResultMiddleware`,
    e `api.registerTrustedToolPolicy(...)` exige cada ID de política em
    `contracts.trustedToolPolicies`. Essas declarações mantêm alinhadas a
    inspeção no momento da instalação e o registro em runtime.

    Para conhecer todos os campos do manifesto, consulte [Manifesto de plugin](/pt-BR/plugins/manifest).

  </Step>

  <Step title="Registre a ferramenta">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Use `definePluginEntry` para plugins que não sejam de canal. Plugins de canal usam
    `defineChannelPluginEntry` de `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Teste o runtime">
    Para um plugin instalado ou externo, inspecione o runtime carregado:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se o plugin registrar um comando da CLI, execute também esse comando e confirme
    a saída, por exemplo, `openclaw demo-plugin ping`.

    Para um plugin incluído neste repositório, o OpenClaw descobre os pacotes de plugin
    do checkout do código-fonte por meio do workspace `extensions/*`. Execute o teste direcionado
    mais próximo:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Teste a instalação do pacote">
    Antes de publicar um plugin pronto para empacotamento, teste o mesmo formato de instalação que os usuários
    receberão. Primeiro, adicione uma etapa de compilação, aponte entradas de runtime como
    `openclaw.extensions` para JavaScript compilado, como `./dist/index.js`, e
    certifique-se de que `npm pack` inclua essa saída em `dist/`. Entradas de código-fonte TypeScript servem
    apenas para checkouts do código-fonte e caminhos de desenvolvimento local.

    Em seguida, empacote o plugin e instale o tarball com `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa o projeto npm gerenciado por plugin do OpenClaw, portanto detecta
    erros de dependência em runtime que testes a partir do checkout do código-fonte podem ocultar. Ele comprova
    o formato do pacote e das dependências, não a confiança oficial vinculada ao catálogo.
    As importações em runtime devem estar em `dependencies` ou `optionalDependencies`;
    dependências deixadas apenas em `devDependencies` não serão instaladas no
    projeto de runtime gerenciado.

    Não use uma instalação bruta por arquivo compactado/caminho como validação final de comportamento oficial ou
    privilegiado do plugin. Códigos-fonte brutos são úteis para depuração local, mas
    não comprovam o mesmo caminho de dependências das instalações pelo npm ou ClawHub. Se
    o seu plugin depender do status confiável de plugin oficial, adicione uma segunda validação
    por meio de uma instalação oficial baseada em catálogo ou de um caminho de pacote publicado que
    registre a confiança oficial. Consulte
    [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) para obter
    detalhes sobre a raiz de instalação e a propriedade das dependências.

  </Step>

  <Step title="Publique">
    Valide o pacote antes de publicar:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Os trechos canônicos de pacotes do ClawHub ficam em `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Instale">
    Instale o pacote publicado por meio do ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registro de ferramentas

As ferramentas podem ser obrigatórias ou opcionais. As ferramentas obrigatórias ficam sempre disponíveis quando o
plugin está habilitado. As ferramentas opcionais exigem a adesão explícita do usuário antes que o OpenClaw
carregue o runtime do plugin proprietário.

As fábricas de ferramentas recebem um contexto de runtime confiável, incluindo `deliveryContext`,
`nativeChannelId` para a conversa ativa na plataforma, quando disponível, e
`requesterSenderId`.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Toda ferramenta registrada com `api.registerTool(...)` também deve ser declarada no
manifesto do plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Os usuários fazem a adesão por meio de `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // ou ["my-plugin"] para todas as ferramentas de um plugin
}
```

As ferramentas opcionais controlam se uma ferramenta é exposta ao modelo. Use
[solicitações de permissão do plugin](/pt-BR/plugins/plugin-permission-requests) quando uma ferramenta
ou hook precisar solicitar aprovação depois que o modelo a selecionar e antes que a
ação seja executada.

Use ferramentas opcionais para efeitos colaterais, binários incomuns ou recursos que
não devam ser expostos por padrão. Os nomes das ferramentas não podem entrar em conflito com nomes de ferramentas
do núcleo; os conflitos são ignorados e informados nos diagnósticos do plugin. Registros
malformados são ignorados e informados da mesma maneira: um `name` ausente ou vazio,
um `execute` que não seja uma função ou um descritor de ferramenta sem um objeto `parameters`.

As fábricas de ferramentas recebem um objeto de contexto fornecido pelo runtime. Use `ctx.activeModel`
quando uma ferramenta precisar registrar, exibir ou se adaptar ao modelo ativo no turno
atual; ele pode incluir `provider`, `modelId` e `modelRef`. Trate-o como
metadados informativos de runtime, não como um limite de segurança contra o operador
local, código de plugin instalado ou um runtime modificado do OpenClaw. Ferramentas locais
sensíveis ainda devem exigir uma adesão explícita do plugin ou do operador e
falhar de modo fechado quando os metadados do modelo ativo estiverem ausentes ou forem inadequados.

O manifesto declara a propriedade e a descoberta; a execução ainda chama a implementação
da ferramenta registrada em uso. Mantenha `toolMetadata.<tool>.optional: true`
alinhado com `api.registerTool(..., { optional: true })` para que o OpenClaw possa evitar
carregar o runtime desse plugin até que a ferramenta seja explicitamente incluída na lista de permissões.

## Convenções de importação

Importe de subcaminhos específicos do SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Não importe do barrel raiz obsoleto:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

No pacote do seu plugin, use arquivos barrel locais, como `api.ts` e
`runtime-api.ts`, para importações internas. Não importe o próprio plugin por meio de um
caminho do SDK. Auxiliares específicos de provedor devem permanecer no pacote do provedor, a menos que
a interface seja realmente genérica.

Métodos RPC personalizados do Gateway são um ponto de entrada avançado. Mantenha-os em um
prefixo específico do plugin; namespaces administrativos do núcleo, como `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*`, permanecem reservados
e são resolvidos como `operator.admin`. A ponte
`openclaw/plugin-sdk/gateway-method-runtime` é reservada para rotas HTTP do plugin
que declaram `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Para ver o mapa completo de importações, consulte [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Lista de verificação antes do envio

<Check>**package.json** contém os metadados `openclaw` corretos</Check>
<Check>O manifesto **openclaw.plugin.json** está presente e é válido</Check>
<Check>O ponto de entrada usa `defineChannelPluginEntry` ou `definePluginEntry`</Check>
<Check>Todas as importações usam caminhos específicos `plugin-sdk/<subpath>`</Check>
<Check>As importações internas usam módulos locais, não autoimportações do SDK</Check>
<Check>Os testes passam (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (plugins no repositório)</Check>

## Teste com versões beta

1. Acompanhe os lançamentos de [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). As tags beta têm o formato `v2026.3.N-beta.1`. Você também pode seguir [@openclaw](https://x.com/openclaw) no X para receber anúncios de lançamentos.
2. Teste seu plugin com a tag beta assim que ela aparecer. O período antes da versão estável normalmente dura apenas algumas horas.
3. Após o teste, publique no tópico do seu plugin no canal `plugin-forum` do Discord ([discord.gg/clawd](https://discord.gg/clawd)), informando `all good` ou o que deixou de funcionar. Crie um tópico caso ainda não tenha um.
4. Se algo deixar de funcionar, abra ou atualize uma issue com o título `Beta blocker: <plugin-name> - <summary>` e aplique o rótulo `beta-blocker`. Inclua o link da issue no seu tópico.
5. Abra um PR para `main` com o título `fix(<plugin-id>): beta blocker - <summary>` e inclua o link da issue tanto no PR quanto no seu tópico do Discord. Colaboradores não podem aplicar rótulos a PRs, portanto o título é o sinal do PR para mantenedores e automações. Bloqueadores com um PR são mesclados; bloqueadores sem um PR ainda podem ser incluídos no lançamento.
6. O silêncio indica que está tudo certo. Perder esse período normalmente significa que sua correção será incluída no próximo ciclo.

## Próximas etapas

<CardGroup cols={2}>
  <Card title="Plugins de canais" icon="messages-square" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens
  </Card>
  <Card title="Plugins de provedores" icon="cpu" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelos
  </Card>
  <Card title="Plugins de backend da CLI" icon="terminal" href="/pt-BR/plugins/cli-backend-plugins">
    Registre um backend local de CLI de IA
  </Card>
  <Card title="Visão geral do SDK" icon="book-open" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importações e da API de registro
  </Card>
  <Card title="Auxiliares de runtime" icon="settings" href="/pt-BR/plugins/sdk-runtime">
    TTS, pesquisa e subagente via api.runtime
  </Card>
  <Card title="Testes" icon="test-tubes" href="/pt-BR/plugins/sdk-testing">
    Utilitários e padrões de teste
  </Card>
  <Card title="Manifesto do plugin" icon="file-json" href="/pt-BR/plugins/manifest">
    Referência completa do esquema do manifesto
  </Card>
</CardGroup>

## Conteúdo relacionado

- [Hooks de plugin](/pt-BR/plugins/hooks)
- [Arquitetura de plugins](/pt-BR/plugins/architecture)
