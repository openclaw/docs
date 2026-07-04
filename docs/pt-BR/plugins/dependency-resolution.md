---
read_when:
    - Você está depurando instalações de pacotes de Plugin
    - Você está alterando o comportamento de inicialização de plugins, do doctor ou de instalação do gerenciador de pacotes
    - Você está mantendo instalações empacotadas do OpenClaw ou manifestos de Plugins incluídos
sidebarTitle: Dependencies
summary: Como o OpenClaw instala pacotes de Plugin e resolve dependências de Plugin
title: Resolução de dependências de Plugin
x-i18n:
    generated_at: "2026-07-04T15:11:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw mantém o trabalho de dependências de plugins no momento de instalação/atualização. O carregamento em tempo de execução
não executa gerenciadores de pacotes, repara árvores de dependências nem modifica o diretório de pacotes do
OpenClaw.

## Divisão de responsabilidades

Pacotes de plugins são responsáveis pelo próprio grafo de dependências:

- dependências de runtime ficam em `dependencies` ou
  `optionalDependencies` do pacote do plugin
- importações do SDK/core são pares ou importações fornecidas pelo OpenClaw
- plugins de desenvolvimento local trazem suas próprias dependências já instaladas
- plugins npm e git são instalados em raízes de pacotes pertencentes ao OpenClaw

OpenClaw é responsável apenas pelo ciclo de vida do plugin:

- descobrir a origem do plugin
- instalar ou atualizar o pacote quando explicitamente solicitado
- registrar os metadados da instalação
- carregar o ponto de entrada do plugin
- falhar com um erro acionável quando faltarem dependências

## Raízes de instalação

OpenClaw usa raízes estáveis por origem:

- pacotes npm são instalados em projetos por plugin em
  `~/.openclaw/npm/projects/<encoded-package>`
- pacotes git são clonados em `~/.openclaw/git`
- instalações locais/por caminho/arquivo são copiadas ou referenciadas sem reparo de dependências

Instalações npm rodam nessa raiz de projeto por plugin com:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` usa essa mesma raiz de projeto npm
por plugin para um tarball npm-pack local. OpenClaw lê os metadados npm do tarball,
adiciona-o ao projeto gerenciado como uma dependência `file:` copiada, executa
a instalação npm normal e então verifica os metadados do lockfile instalado antes
de confiar no plugin.
Isso é destinado a provas de aceitação de pacote e de release candidate em que um
artefato local de pacote deve se comportar como o artefato de registro que ele simula.

Use `npm-pack:` ao testar pacotes de plugins oficiais ou externos antes da
publicação. Uma instalação por arquivo bruto ou caminho é útil para depuração local, mas
não prova o mesmo caminho de dependências que um pacote npm ou ClawHub instalado.
`npm-pack:` prova o formato de instalação do pacote gerenciado; por si só,
não é prova de que o plugin é conteúdo oficial vinculado a catálogo.

Quando o comportamento depender do status de plugin empacotado ou plugin oficial confiável, combine
a prova do pacote local com uma instalação oficial baseada em catálogo ou um caminho de
pacote publicado que registre confiança oficial. Acesso a helpers privilegiados e
tratamento de escopo oficial confiável devem ser validados nesse caminho de instalação confiável,
não inferidos de uma instalação de tarball local.

Se um plugin falhar em tempo de execução com uma importação ausente, corrija o manifesto do pacote
em vez de reparar manualmente o projeto gerenciado. Importações de runtime pertencem a
`dependencies` ou `optionalDependencies` do pacote do plugin; `devDependencies` não são
instaladas para projetos de runtime gerenciado. Um `npm install` local dentro de
`~/.openclaw/npm/projects/<encoded-package>` pode desbloquear um diagnóstico temporário,
mas não é prova de aceitação de pacote, porque a próxima instalação ou atualização
recriará o projeto a partir dos metadados do pacote.

npm pode elevar dependências transitivas para o
`node_modules` do projeto por plugin ao lado do pacote do plugin. OpenClaw varre a raiz
do projeto gerenciado antes de confiar na instalação e remove esse projeto durante a desinstalação, então
dependências de runtime elevadas permanecem dentro do limite de limpeza desse plugin.

Pacotes de plugins npm publicados podem enviar `npm-shrinkwrap.json`. npm usa esse
lockfile publicável durante a instalação, e a raiz de projeto npm gerenciada pelo OpenClaw
o suporta pelo caminho normal de instalação npm. Pacotes de plugins publicáveis
pertencentes ao OpenClaw devem incluir um shrinkwrap local do pacote gerado a partir do
grafo de dependências publicado desse pacote de plugin:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

O gerador remove `devDependencies` do plugin, aplica a política de overrides do workspace
e grava `extensions/<id>/npm-shrinkwrap.json` para cada plugin
`publishToNpm`. Pacotes de plugins de terceiros também podem enviar shrinkwrap;
OpenClaw não o exige para pacotes da comunidade, mas npm o respeitará
quando presente.

Antes de tratar um pacote local como prova de release candidate, inspecione o tarball
que será instalado:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Para mudanças de dependência, verifique também se uma instalação de produção consegue resolver os
pacotes de runtime sem dependências de desenvolvimento:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Pacotes de plugins npm pertencentes ao OpenClaw também podem publicar com
`bundledDependencies` explícitas. O caminho de publicação npm sobrepõe a lista de nomes de
dependências de runtime, remove metadados de workspace somente de desenvolvimento do manifesto
do pacote publicado, executa uma instalação npm sem scripts para dependências de runtime
locais do pacote e então empacota ou publica o tarball do plugin com esses arquivos de dependência
incluídos. Pacotes pesados em nativos, incluindo runtimes Codex e ACP, optam por sair
com `openclaw.release.bundleRuntimeDependencies: false`; esses pacotes ainda
enviam seu shrinkwrap, mas npm resolve as dependências de runtime durante a instalação
em vez de incorporar todos os binários de plataforma no tarball do plugin. O pacote raiz
`openclaw` não empacota toda a sua árvore de dependências.

Plugins que importam `openclaw/plugin-sdk/*` declaram `openclaw` como uma dependência peer.
OpenClaw não permite que npm instale uma cópia separada do pacote host a partir do registro
em um projeto gerenciado, porque pacotes host desatualizados podem afetar a resolução de peers do npm
dentro desse plugin. Instalações npm gerenciadas pulam a resolução/materialização de peers do npm
e o OpenClaw reafirma links `node_modules/openclaw` locais do plugin para pacotes instalados
que declaram o peer host após a instalação ou atualização.

Instalações git clonam ou atualizam o repositório e então executam:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

O plugin instalado então carrega a partir desse diretório de pacote, então a resolução de
`node_modules` local do pacote e pai funciona da mesma forma que em um pacote
Node normal.

## Plugins locais

Plugins locais são tratados como diretórios controlados pelo desenvolvedor. OpenClaw não
executa `npm install`, `pnpm install` nem reparo de dependências para eles. Se um plugin
local tiver dependências, instale-as nesse plugin antes de carregá-lo.

Plugins locais TypeScript de terceiros podem usar o caminho emergencial Jiti. Plugins
JavaScript empacotados e plugins internos empacotados carregam por
import/require nativo em vez de Jiti.

## Inicialização e recarregamento

A inicialização do Gateway e o recarregamento de configuração nunca instalam dependências de plugins. Eles leem
os registros de instalação do plugin, calculam o ponto de entrada e o carregam.

Se uma dependência estiver ausente em tempo de execução, o plugin falha ao carregar e o erro
deve apontar o operador para uma correção explícita:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` pode limpar estado de dependência legado gerado pelo OpenClaw e recuperar
plugins baixáveis que estão ausentes dos registros de instalação locais quando a configuração
os referencia. Doctor não repara dependências para um plugin local já instalado.

## Plugins empacotados

Plugins empacotados leves e críticos para o core são enviados como parte do OpenClaw.
Eles devem não ter uma árvore pesada de dependências de runtime ou ser movidos para um
pacote baixável no ClawHub/npm.

Para a lista gerada atual de plugins enviados no pacote core, instalados
externamente ou mantidos apenas como fonte, consulte [Inventário de plugins](/pt-BR/plugins/plugin-inventory).

Manifestos de plugins empacotados não devem solicitar preparo de dependências. Funcionalidade
grande ou opcional de plugin deve ser empacotada como um plugin normal e instalada pelo
mesmo caminho npm/git/ClawHub que plugins de terceiros.

Em checkouts de código-fonte, OpenClaw trata o repositório como um monorepo pnpm. Depois de
`pnpm install`, plugins empacotados carregam de `extensions/<id>`, então dependências
de workspace locais do pacote ficam disponíveis e edições são capturadas diretamente. O desenvolvimento
em checkout de código-fonte é somente pnpm; `npm install` simples na raiz do repositório não é
uma forma compatível de preparar dependências de plugins empacotados.

| Formato de instalação             | Localização do plugin empacotado      | Responsável pelas dependências                                             |
| --------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `npm install -g openclaw`         | Árvore de runtime construída dentro do pacote | Pacote OpenClaw e fluxos explícitos de instalação/atualização/doctor do plugin |
| Checkout git mais `pnpm install`  | Pacotes de workspace `extensions/<id>` | O workspace pnpm, incluindo as dependências próprias de cada pacote de plugin |
| `openclaw plugins install ...`    | Raiz gerenciada de projeto npm/git/ClawHub | O fluxo de instalação/atualização do plugin                                |

## Limpeza legada

Versões mais antigas do OpenClaw geravam raízes de dependências de plugins empacotados na inicialização ou
durante reparo do doctor. A limpeza atual do doctor remove esses diretórios e
symlinks obsoletos quando `--fix` é usado, incluindo antigas raízes `plugin-runtime-deps`, symlinks
globais de pacotes do prefixo Node que apontam para destinos `plugin-runtime-deps` podados,
manifestos `.openclaw-runtime-deps*`, `node_modules` de plugins gerados, diretórios
de estágio de instalação e stores pnpm locais do pacote. O postinstall empacotado também
remove esses symlinks globais antes de podar as raízes de destino legadas, para que upgrades
não deixem importações pendentes de pacotes ESM.

Instalações npm mais antigas também usavam uma raiz compartilhada `~/.openclaw/npm/node_modules`.
Os fluxos atuais de instalação, atualização, desinstalação e doctor ainda reconhecem essa raiz plana legada
somente para recuperação e limpeza. Novas instalações npm devem criar
raízes de projeto por plugin em vez disso.
