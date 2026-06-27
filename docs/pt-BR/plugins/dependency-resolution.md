---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de Plugin, doctor ou instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de plugins incluídos no pacote
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

O OpenClaw mantém o trabalho de dependências de Plugin no momento da instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacote do OpenClaw.

## Divisão de responsabilidades

Os pacotes de Plugin são donos do próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou `optionalDependencies`
  do pacote de Plugin
- importações de SDK/core são peer ou importações fornecidas pelo OpenClaw
- Plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- Plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

O OpenClaw é dono apenas do ciclo de vida do Plugin:

- descobrir a origem do Plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o entrypoint do Plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

O OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em projetos por Plugin em
  `~/.openclaw/npm/projects/<encoded-package>`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas nessa raiz de projeto por Plugin com:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz de projeto npm
por Plugin para um tarball npm-pack local. O OpenClaw lê os metadados npm do tarball,
adiciona-o ao projeto gerenciado como uma dependência `file:` copiada, executa
a instalação npm normal e então verifica os metadados do lockfile instalado antes
de confiar no Plugin.
Isso é destinado a provas de aceitação de pacote e de release candidate em que um
artefato local empacotado deve se comportar como o artefato de registro que ele simula.

O npm pode içar dependências transitivas para o `node_modules` do projeto por Plugin,
ao lado do pacote de Plugin. O OpenClaw verifica a raiz do projeto gerenciado
antes de confiar na instalação e remove esse projeto durante a desinstalação, portanto
dependências de runtime içadas permanecem dentro do limite de limpeza desse Plugin.

Pacotes de Plugin npm publicados podem enviar `npm-shrinkwrap.json`. O npm usa esse
lockfile publicável durante a instalação, e a raiz de projeto npm gerenciada pelo OpenClaw
oferece suporte a ele pelo caminho normal de instalação npm. Pacotes de Plugin publicáveis
pertencentes ao OpenClaw devem incluir um shrinkwrap local ao pacote gerado a partir do
grafo de dependências publicado desse pacote de Plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

O gerador remove `devDependencies` de Plugin, aplica a política de override do workspace
e grava `extensions/<id>/npm-shrinkwrap.json` para cada Plugin `publishToNpm`.
Pacotes de Plugin de terceiros também podem enviar shrinkwrap; o OpenClaw não o exige
para pacotes da comunidade, mas o npm o respeitará quando presente.

Pacotes de Plugin npm pertencentes ao OpenClaw também podem publicar com
`bundledDependencies` explícitas. O caminho de publicação npm sobrepõe a lista de nomes
de dependências de runtime, remove metadados de workspace somente de desenvolvimento
do manifesto do pacote publicado, executa uma instalação npm sem scripts para dependências
de runtime locais ao pacote e então empacota ou publica o tarball do Plugin com esses
arquivos de dependência incluídos. Pacotes pesados em código nativo, incluindo runtimes
Codex e ACP, optam por não participar com `openclaw.release.bundleRuntimeDependencies: false`;
esses pacotes ainda enviam seu shrinkwrap, mas o npm resolve dependências de runtime durante
a instalação em vez de embutir todo binário de plataforma no tarball do Plugin. O pacote raiz
`openclaw` não empacota sua árvore de dependências completa.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como dependência peer.
O OpenClaw não permite que o npm instale uma cópia separada do pacote host vinda do registro
em um projeto gerenciado, porque pacotes host desatualizados podem afetar a resolução peer
do npm dentro desse Plugin. Instalações npm gerenciadas ignoram a resolução/materialização
peer do npm, e o OpenClaw reafirma links `node_modules/openclaw` locais ao Plugin para
pacotes instalados que declaram o host peer após a instalação ou atualização.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O Plugin instalado então carrega a partir desse diretório de pacote, então a resolução
de `node_modules` local ao pacote e pai funciona da mesma forma que em um pacote Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados por desenvolvedor. O OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um Plugin
local tiver dependências, instale-as nesse Plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e Plugins internos embutidos carregam por import/require nativo
em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências
de Plugin. Eles leem os registros de instalação do Plugin, calculam o entrypoint e o carregam.

Se uma dependência estiver ausente em runtime, o Plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependências legado gerado pelo OpenClaw e recuperar
Plugins baixáveis que estejam ausentes dos registros de instalação locais quando a configuração
os referencia. O Doctor não repara dependências de um Plugin local já instalado.

## Plugins embutidos

Plugins embutidos leves e críticos para o core são enviados como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de runtime ou devem ser movidos
para um pacote baixável no ClawHub/npm.

Para a lista gerada atual de Plugins que são enviados no pacote core, instalados
externamente ou mantidos apenas como código-fonte, consulte [Inventário de Plugins](/pt-BR/plugins/plugin-inventory).

Manifestos de Plugin embutido não devem solicitar staging de dependências. Funcionalidade
de Plugin grande ou opcional deve ser empacotada como um Plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub de Plugins de terceiros.

Em checkouts de código-fonte, o OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, Plugins embutidos carregam de `extensions/<id>`, então dependências de
workspace locais ao pacote ficam disponíveis e edições são captadas diretamente. O desenvolvimento
em checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de Plugin embutido.

| Forma de instalação              | Local do Plugin embutido              | Dono das dependências                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime criada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de Plugin |
| Checkout Git mais `pnpm install` | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de Plugin |
| `openclaw plugins install ...`   | Raiz gerenciada npm project/git/ClawHub | O fluxo de instalação/atualização do Plugin                          |

## Limpeza legada

Versões mais antigas do OpenClaw geravam raízes de dependências de Plugins embutidos na inicialização
ou durante reparo pelo doctor. A limpeza atual do doctor remove esses diretórios e symlinks obsoletos
quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`, symlinks globais de pacote
com prefixo Node que apontam para alvos `plugin-runtime-deps` podados, manifestos
`.openclaw-runtime-deps*`, `node_modules` de Plugin gerados, diretórios de staging de instalação e
stores pnpm locais ao pacote. O postinstall empacotado também remove esses symlinks globais antes
de podar as raízes de alvo legadas, para que atualizações não deixem importações de pacote ESM pendentes.

Instalações npm mais antigas também usavam uma raiz compartilhada `~/.openclaw/npm/node_modules`.
Os fluxos atuais de instalação, atualização, desinstalação e doctor ainda reconhecem essa raiz plana
legada apenas para recuperação e limpeza. Novas instalações npm devem criar raízes de projeto por Plugin.
