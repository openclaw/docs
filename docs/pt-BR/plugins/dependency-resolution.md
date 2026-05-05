---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização do Plugin, do doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de plugins incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Resolução de dependências de Plugin

OpenClaw mantém o trabalho de dependências de plugins no momento da instalação/atualização. O carregamento em runtime
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório do pacote
OpenClaw.

## Divisão de responsabilidades

Pacotes de Plugin são responsáveis pelo próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou
  `optionalDependencies` do pacote de Plugin
- importações de SDK/core são pares ou importações fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacote pertencentes ao OpenClaw

OpenClaw é responsável apenas pelo ciclo de vida do Plugin:

- descobrir a origem do Plugin
- instalar ou atualizar o pacote quando solicitado explicitamente
- registrar os metadados de instalação
- carregar o ponto de entrada do Plugin
- falhar com um erro acionável quando dependências estiverem ausentes

## Raízes de instalação

OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em `~/.openclaw/npm`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/de caminho/de arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm são executadas na raiz npm com:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

O npm pode elevar dependências transitivas para `~/.openclaw/npm/node_modules` ao lado
do pacote de Plugin. OpenClaw verifica a raiz npm gerenciada antes de confiar na
instalação e usa npm para remover pacotes gerenciados por npm durante a desinstalação, para que dependências
de runtime elevadas permaneçam dentro do limite de limpeza gerenciado.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O Plugin instalado então carrega a partir desse diretório de pacote, então a resolução
de `node_modules` local ao pacote e pai funciona da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um
Plugin local tiver dependências, instale-as nesse Plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e plugins internos incluídos carregam por
import/require nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de Plugin. Eles leem
os registros de instalação de Plugin, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em runtime, o Plugin falha ao carregar e o erro
deve indicar ao operador uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependências legado gerado pelo OpenClaw e recuperar
plugins baixáveis que estão ausentes dos registros de instalação locais quando a configuração
os referencia. Doctor não repara dependências de um Plugin local já instalado.

## Plugins incluídos

Plugins incluídos leves e críticos para o core são distribuídos como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de runtime ou ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins que são distribuídos no pacote core, instalados
externamente ou permanecem apenas como código-fonte, consulte [Inventário de Plugin](/pt-BR/plugins/plugin-inventory).

Manifestos de Plugin incluídos não devem solicitar preparação de dependências. Funcionalidade
de Plugin grande ou opcional deve ser empacotada como um Plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, OpenClaw trata o repositório como um monorepo pnpm. Após
`pnpm install`, plugins incluídos carregam a partir de `extensions/<id>`, para que dependências
de workspace locais ao pacote fiquem disponíveis e edições sejam capturadas diretamente. O desenvolvimento
em checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório
não é uma forma compatível de preparar dependências de Plugin incluído.

| Formato de instalação            | Local do Plugin incluído              | Responsável pela dependência                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Árvore de runtime criada dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor de Plugin |
| Checkout git mais `pnpm install` | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de Plugin |
| `openclaw plugins install ...`   | Raiz gerenciada de Plugin npm/git/ClawHub | O fluxo de instalação/atualização de Plugin                          |

## Limpeza legada

Versões antigas do OpenClaw geravam raízes de dependências de Plugin incluído na inicialização ou
durante o reparo do doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo raízes antigas `plugin-runtime-deps`, symlinks
de pacotes de prefixo global do Node que apontam para destinos `plugin-runtime-deps` removidos,
manifestos `.openclaw-runtime-deps*`, `node_modules` de Plugin gerado, diretórios de estágio
de instalação e stores pnpm locais ao pacote. O postinstall empacotado também
remove esses symlinks globais antes de remover as raízes de destino legadas para que atualizações
não deixem importações pendentes de pacotes ESM.

Esses caminhos são apenas resíduos legados. Novas instalações não devem criá-los.
