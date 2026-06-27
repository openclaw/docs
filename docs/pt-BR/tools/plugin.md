---
doc-schema-version: 1
read_when:
    - Instalando ou configurando plugins
    - Entendendo a descoberta de Plugins e as regras de carregamento
    - Trabalhando com pacotes de Plugin compatíveis com Codex/Claude
sidebarTitle: Getting Started
summary: Instale, configure e gerencie Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-06-27T18:18:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

Plugins estendem o OpenClaw com canais, provedores de modelo, harnesses de agente, ferramentas,
skills, fala, transcrição em tempo real, voz, entendimento de mídia, geração,
busca web, pesquisa web e outros recursos de runtime.

Use esta página quando quiser instalar um plugin, reiniciar o Gateway, verificar
se o runtime o carregou e encaminhar falhas comuns de configuração. Para exemplos
somente de comandos, consulte [Gerenciar plugins](/pt-BR/plugins/manage-plugins). Para o inventário completo gerado
de plugins integrados, externos oficiais e somente de código-fonte, consulte
[Inventário de plugins](/pt-BR/plugins/plugin-inventory).

## Requisitos

Antes de instalar um plugin, certifique-se de ter:

- um checkout ou instalação do OpenClaw com a CLI `openclaw` disponível
- acesso de rede à origem selecionada, como ClawHub, npm ou um host git
- quaisquer credenciais, chaves de configuração ou ferramentas de sistema operacional específicas do plugin nomeadas
  pela documentação de configuração desse plugin
- permissão para o Gateway que atende seus canais recarregar ou reiniciar

## Início rápido

<Steps>
  <Step title="Encontrar o plugin">
    Pesquise no [ClawHub](/pt-BR/clawhub) por pacotes públicos de plugins:

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub é a principal superfície de descoberta para plugins da comunidade. Durante a
    transição de lançamento, especificações comuns de pacotes sem prefixo ainda são instaladas a partir do npm, a menos
    que correspondam a um id de plugin oficial. Especificações brutas de pacote `@openclaw/*` que correspondem
    a plugins integrados usam a cópia integrada da compilação atual do OpenClaw. Use um
    prefixo explícito quando precisar de uma origem específica.

  </Step>

  <Step title="Instalar o plugin">
    ```bash
    # Do ClawHub.
    openclaw plugins install clawhub:<package>

    # Do npm.
    openclaw plugins install npm:<package>

    # Do git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # De um checkout de desenvolvimento local.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    Trate instalações de plugins como execução de código. Prefira versões fixadas quando você
    precisar de instalações de produção reproduzíveis.

  </Step>

  <Step title="Configurar e habilitá-lo">
    Configure ajustes específicos do plugin em `plugins.entries.<id>.config`.
    Habilite o plugin quando ele ainda não estiver habilitado:

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    Se sua configuração usar uma lista restritiva `plugins.allow`, o id do plugin instalado
    deve estar presente nela antes que o plugin possa carregar.
    `openclaw plugins install` adiciona o id instalado a uma lista
    `plugins.allow` existente e remove o mesmo id de `plugins.deny` para que a
    instalação explícita possa carregar após a reinicialização.

  </Step>

  <Step title="Permitir que o Gateway recarregue">
    Instalar, atualizar ou desinstalar código de plugin requer uma reinicialização do Gateway.
    Quando um Gateway gerenciado já está em execução com recarregamento de configuração
    habilitado, o OpenClaw detecta o registro alterado de instalação do plugin e reinicia o
    Gateway automaticamente. Se o Gateway não for gerenciado ou o recarregamento estiver desabilitado,
    reinicie-o você mesmo:

    ```bash
    openclaw gateway restart
    ```

    Operações de habilitar e desabilitar atualizam a configuração e renovam o registro frio.
    Uma inspeção de runtime ainda é o caminho de verificação mais claro para superfícies de runtime
    ativas.

  </Step>

  <Step title="Verificar registro de runtime">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    Use `--runtime` quando precisar comprovar ferramentas, hooks, serviços,
    métodos do Gateway ou comandos de CLI pertencentes ao plugin registrados. `inspect` simples é uma verificação fria
    de manifesto e registro.

  </Step>
</Steps>

## Configuração

### Escolher uma origem de instalação

| Origem      | Use quando                                                                       | Exemplo                                                        |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | Você quer descoberta nativa do OpenClaw, verificações, metadados de versão e dicas de instalação | `openclaw plugins install clawhub:<package>`                   |
| npm         | Você precisa de fluxos diretos de registro npm ou dist-tag                             | `openclaw plugins install npm:<package>`                       |
| git         | Você precisa de um branch, tag ou commit de um repositório                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| caminho local  | Você está desenvolvendo ou testando um plugin na mesma máquina                     | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | Você está instalando um plugin de marketplace compatível com Claude                      | `openclaw plugins install <plugin> --marketplace <source>`     |

Especificações de pacote sem prefixo têm comportamento especial de compatibilidade. Se o nome sem prefixo corresponder
a um id de plugin integrado, o OpenClaw usa essa origem integrada. Se corresponder a um
id de plugin externo oficial, o OpenClaw usa o catálogo oficial de pacotes. Outras
especificações comuns de pacote sem prefixo são instaladas pelo npm durante a transição de lançamento. Especificações brutas
de pacote `@openclaw/*` que correspondem a plugins integrados também resolvem para a
cópia integrada antes do fallback para npm. Use `npm:@openclaw/<plugin>@<version>` quando
você quiser deliberadamente o pacote npm externo em vez da cópia integrada
pertencente à imagem. Use `clawhub:`, `npm:`, `git:` ou `npm-pack:` quando precisar
de seleção determinística de origem. Consulte [`openclaw plugins`](/pt-BR/cli/plugins#install)
para o contrato completo do comando.

Para instalações npm, especificações de pacote sem versão fixa e `@latest` escolhem o pacote estável mais recente
que anuncia compatibilidade com esta compilação do OpenClaw. Se a versão
latest atual do npm declarar um `openclaw.compat.pluginApi` ou
`openclaw.install.minHostVersion` mais novo, o OpenClaw verifica versões estáveis de pacote mais antigas
e instala a mais nova que se encaixa. Versões exatas e tags de canal explícitas
como `@beta` permanecem fixadas ao pacote selecionado e falham quando incompatíveis.

### Política de instalação do operador

Configure `security.installPolicy` para executar um comando de política local confiável antes que a
instalação ou atualização do plugin prossiga. A política recebe metadados mais o caminho de origem
preparado e pode permitir ou bloquear a instalação. Ela cobre caminhos de instalação/atualização de plugins
via CLI e baseados no Gateway. Hooks `before_install` de plugins são executados depois apenas em
processos OpenClaw em que hooks de plugins são carregados, então use `security.installPolicy`
para decisões de instalação pertencentes ao operador. A flag obsoleta
`--dangerously-force-unsafe-install` é aceita por compatibilidade, mas não
ignora a política de instalação nem a denylist integrada de dependências de plugins do OpenClaw.

Consulte [Configuração de Skills](/pt-BR/tools/skills-config#operator-install-policy-securityinstallpolicy)
para o schema exec compartilhado de `security.installPolicy` usado por skills e
plugins.

### Configurar política de plugins

O formato comum de configuração de plugins é:

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

Regras principais de política:

- `plugins.enabled: false` desabilita todos os plugins e pula o trabalho de descoberta/carregamento
  de plugins. Referências obsoletas a plugins ficam inertes enquanto isso está ativo; reabilite
  plugins antes de executar a limpeza do doctor quando quiser remover ids obsoletos.
- `plugins.deny` prevalece sobre allow e habilitação por plugin.
- `plugins.allow` é uma allowlist exclusiva. Ferramentas pertencentes a plugins fora da
  allowlist permanecem indisponíveis, mesmo quando `tools.allow` inclui `"*"`.
- `plugins.entries.<id>.enabled: false` desabilita um plugin enquanto preserva sua
  configuração.
- `plugins.load.paths` adiciona arquivos ou diretórios explícitos de plugins locais. Caminhos locais gerenciados por
  `plugins install` devem ser diretórios ou arquivos compactados de plugin; use
  `plugins.load.paths` para arquivos de plugin independentes.
- Plugins originados do workspace são desabilitados por padrão; habilite-os explicitamente ou
  coloque-os na allowlist antes de usar código local do workspace.
- Plugins integrados seguem seus metadados integrados default-on/default-off, a menos que
  a configuração os substitua explicitamente.
- `plugins.slots.<slot>` escolhe um plugin para categorias exclusivas como
  mecanismos de memória e contexto. A seleção de slot força a habilitação do plugin selecionado
  para esse slot ao contar como ativação explícita; ele pode carregar mesmo quando
  de outra forma seria opt-in. `plugins.deny` e
  `plugins.entries.<id>.enabled: false` ainda o bloqueiam.
- Plugins integrados opt-in podem ser ativados automaticamente quando a configuração nomeia uma de suas superfícies
  pertencentes, como uma ref de provedor/modelo, configuração de canal, backend de CLI ou runtime
  de harness de agente.
- O roteamento de Codex da família OpenAI mantém os limites de plugin de provedor e runtime
  separados: refs de modelos Codex legadas são configuração legada reparada pelo doctor, enquanto o plugin integrado
  `codex` possui o runtime do servidor de aplicativo Codex para refs de agente canônicas `openai/*`,
  `agentRuntime.id: "codex"` explícito e refs legadas `codex/*`.

Quando `plugins.allow` não está definido e plugins não integrados são descobertos automaticamente a partir
do workspace ou raízes globais de plugins, os logs de inicialização registram
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`.
O aviso inclui ids de plugins descobertos e, para listas curtas, um snippet mínimo de
`plugins.allow`. Execute
[`openclaw plugins list --enabled --verbose`](/pt-BR/cli/plugins#list) ou
[`openclaw plugins inspect <id>`](/pt-BR/cli/plugins#inspect) com o id do plugin listado
antes de copiar plugins confiáveis para `openclaw.json`. A mesma orientação de fixação de confiança
se aplica quando diagnósticos dizem que um plugin carregou
`without install/load-path provenance`: inspecione esse id de plugin e então fixe o
id confiável em `plugins.allow` ou reinstale a partir de uma origem confiável para que o OpenClaw
registre a proveniência da instalação.

Execute `openclaw doctor` ou `openclaw doctor --fix` quando a validação de configuração relatar
ids de plugins obsoletos, incompatibilidades de allowlist/ferramentas ou caminhos legados de plugins integrados.

## Entender formatos de plugins

O OpenClaw reconhece dois formatos de plugin:

| Formato                 | Como carrega                                                                 | Use quando                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plugin nativo do OpenClaw | `openclaw.plugin.json` mais um módulo de runtime carregado no processo               | Você está instalando ou criando recursos de runtime específicos do OpenClaw  |
| Bundle compatível      | Layout de plugin Codex, Claude ou Cursor mapeado para o inventário de plugins do OpenClaw | Você está reutilizando skills, comandos, hooks ou metadados de bundle compatíveis |

Ambos os formatos aparecem em `openclaw plugins list`, `openclaw plugins inspect`,
`openclaw plugins enable` e `openclaw plugins disable`. Consulte
[Bundles de plugins](/pt-BR/plugins/bundles) para o limite de compatibilidade de bundles e
[Criando plugins](/pt-BR/plugins/building-plugins) para autoria de plugins nativos.

## Hooks de plugins

Plugins podem registrar hooks em runtime, mas há duas APIs diferentes com
trabalhos diferentes.

- Use hooks tipados via `api.on(...)` para hooks de ciclo de vida do runtime. Esta é a
  superfície preferida para middleware, política, reescrita de mensagens, modelagem de prompts
  e controle de ferramentas.
- Use `api.registerHook(...)` somente quando quiser participar do sistema interno
  de hooks descrito em [Hooks](/pt-BR/automation/hooks). Isso é principalmente para efeitos colaterais amplos de
  comandos/ciclo de vida e compatibilidade com automação existente no estilo HOOK.

Regra rápida:

- Se o handler precisar de prioridade, semântica de mesclagem ou comportamento de bloquear/cancelar, use
  hooks tipados de plugin.
- Se o handler apenas reagir a `command:new`, `command:reset`, `message:sent`,
  ou eventos amplos semelhantes, `api.registerHook(...)` é adequado.

Hooks internos gerenciados por plugin aparecem em `openclaw hooks list` com
`plugin:<id>`. Você não pode habilitá-los ou desabilitá-los por meio de `openclaw hooks`;
em vez disso, habilite ou desabilite o plugin.

## Verificar o Gateway ativo

`openclaw plugins list` e `openclaw plugins inspect` simples leem configuração,
manifesto e estado do registro em frio. Eles não comprovam que um Gateway já em
execução importou o mesmo código de plugin.

Quando um plugin aparece instalado, mas o tráfego de chat ativo não o usa:

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

Gateways gerenciados reiniciam automaticamente após alterações de instalação,
atualização e desinstalação de plugins que alteram o código-fonte do plugin. Em
instalações em VPS ou contêiner, certifique-se de que qualquer reinicialização
manual tenha como alvo o processo filho real de `openclaw gateway run` que
atende seus canais, não apenas um wrapper ou supervisor.

## Solução de problemas

| Sintoma                                                        | Verificação                                                                                                                                      | Correção                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| O plugin aparece em `plugins list`, mas os hooks de runtime não executam | Use `openclaw plugins inspect <id> --runtime --json` e confirme o Gateway ativo com `gateway status --deep --require-rpc`             | Reinicie o Gateway ativo após alterações de instalação, atualização, configuração ou código-fonte                               |
| Diagnósticos de propriedade duplicada de canal ou ferramenta aparecem | Execute `openclaw plugins list --enabled --verbose`, inspecione cada plugin suspeito com `--runtime --json` e compare a propriedade de canais/ferramentas | Desabilite um proprietário, remova instalações obsoletas ou use `preferOver` no manifesto para substituição intencional      |
| A configuração diz que um plugin está ausente | Consulte o [Inventário de plugins](/pt-BR/plugins/plugin-inventory) para saber se ele é empacotado, externo oficial ou somente código-fonte                           | Instale o pacote externo, habilite o plugin empacotado ou remova a configuração obsoleta                         |
| A configuração é inválida durante a instalação | Leia a mensagem de validação e execute `openclaw doctor --fix` quando ela apontar para estado de plugin obsoleto                                           | O Doctor pode colocar em quarentena a configuração inválida do plugin desabilitando a entrada e removendo a carga útil inválida     |
| O caminho do plugin está bloqueado por propriedade ou permissões suspeitas | Inspecione o diagnóstico antes do erro de configuração                                                                                             | Corrija a propriedade/permissões do sistema de arquivos e execute `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` bloqueia comandos de ciclo de vida | Confirme que a instalação é gerenciada pelo Nix                                                                                                      | Altere a seleção de plugins no código-fonte do Nix em vez de usar comandos mutadores de plugins                      |
| A importação de dependência falha em runtime | Verifique se o plugin foi instalado via npm/git/ClawHub ou carregado de um caminho local                                                 | Execute `openclaw plugins update <id>`, reinstale o código-fonte ou instale você mesmo as dependências do plugin local |

Quando uma configuração obsoleta de plugin ainda nomeia um plugin de canal que
não pode mais ser descoberto, a inicialização do Gateway ignora esse canal com
suporte de plugin em vez de bloquear todos os outros canais. Execute
`openclaw doctor --fix` para remover entradas obsoletas de plugin e canal.
Chaves de canal desconhecidas sem evidência de plugin obsoleto ainda falham na
validação para que erros de digitação continuem visíveis.

Para substituição intencional de canal, o plugin preferido deve declarar
`channelConfigs.<channel-id>.preferOver` com o id do plugin legado ou de menor
prioridade. Se ambos os plugins estiverem explicitamente habilitados, o
OpenClaw mantém essa solicitação e relata diagnósticos de canal ou ferramenta
duplicados em vez de escolher silenciosamente um proprietário.

Se um pacote instalado informar que ele `requires compiled runtime output for
TypeScript entry ...`, o pacote foi publicado sem os arquivos JavaScript de que
o OpenClaw precisa em runtime. Atualize ou reinstale depois que o publicador
enviar JavaScript compilado, ou desabilite/desinstale o plugin até lá.

### Propriedade de caminho de plugin bloqueada

Se os diagnósticos de plugin disserem
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
e a validação de configuração vier em seguida com `plugin present but blocked`,
o OpenClaw encontrou arquivos de plugin pertencentes a um usuário Unix
diferente daquele do processo que os está carregando. Mantenha a configuração
do plugin em vigor; corrija a propriedade do sistema de arquivos ou execute o
OpenClaw como o mesmo usuário que possui o diretório de estado.

Para instalações Docker, a imagem oficial executa como `node` (uid `1000`),
portanto os diretórios de configuração e workspace do OpenClaw montados por
bind no host normalmente devem pertencer ao uid `1000`:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Se você executar intencionalmente o OpenClaw como root, corrija a raiz de
plugins gerenciada para propriedade de root:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Depois de corrigir a propriedade, execute novamente `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` para que o registro de plugins persistido
corresponda aos arquivos corrigidos.

### Configuração lenta de ferramentas de plugin

Se os turnos do agente parecerem travar durante a preparação de ferramentas,
habilite o registro em log de rastreamento e procure linhas de temporização de
factory de ferramentas de plugin:

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Procure por:

```text
[trace:plugin-tools] factory timings ...
```

O resumo lista o tempo total de factory e as factories de ferramentas de
plugin mais lentas, incluindo id do plugin, nomes de ferramentas declarados,
formato do resultado e se a ferramenta é opcional. Linhas lentas são promovidas
a avisos quando uma única factory leva pelo menos 1s ou quando a preparação
total de factories de ferramentas de plugin leva pelo menos 5s.

O OpenClaw armazena em cache resultados bem-sucedidos de factories de
ferramentas de plugin para resoluções repetidas com o mesmo contexto efetivo da
solicitação. A chave do cache inclui a configuração efetiva de runtime, o
workspace, ids de agente/sessão, política de sandbox, configurações do
navegador, contexto de entrega, identidade do solicitante e estado de
propriedade, portanto factories que dependem desses campos confiáveis são
executadas novamente quando o contexto muda. Se as temporizações continuarem
altas, o plugin pode estar fazendo trabalho caro antes de retornar suas
definições de ferramentas.

Se um plugin dominar a temporização, inspecione seus registros de runtime:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Depois atualize, reinstale ou desabilite esse plugin. Autores de plugins devem
mover carregamentos caros de dependências para trás do caminho de execução da
ferramenta em vez de fazê-los dentro da factory da ferramenta.

Para raízes de dependência, validação de metadados de pacote, registros de
registro, comportamento de recarregamento na inicialização e limpeza legada,
consulte [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution).

## Relacionados

- [Gerenciar plugins](/pt-BR/plugins/manage-plugins) - exemplos de comandos para listar, instalar, atualizar, desinstalar e publicar
- [`openclaw plugins`](/pt-BR/cli/plugins) - referência completa da CLI
- [Inventário de plugins](/pt-BR/plugins/plugin-inventory) - lista gerada de plugins empacotados e externos
- [Referência de plugins](/pt-BR/plugins/reference) - páginas de referência geradas por plugin
- [Plugins da comunidade](/pt-BR/plugins/community) - descoberta no ClawHub e política de PRs de documentação
- [Resolução de dependências de plugins](/pt-BR/plugins/dependency-resolution) - raízes de instalação, registros de registro e limites de runtime
- [Criação de plugins](/pt-BR/plugins/building-plugins) - guia de autoria de plugins nativos
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview) - registro de runtime, hooks e campos de API
- [Manifesto de plugin](/pt-BR/plugins/manifest) - metadados de manifesto e pacote
