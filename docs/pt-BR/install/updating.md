---
read_when:
    - Atualizando o OpenClaw
    - Algo deixa de funcionar após uma atualização
summary: Atualização segura do OpenClaw (instalação global ou a partir do código-fonte), além da estratégia de reversão
title: Atualizando
x-i18n:
    generated_at: "2026-07-16T12:36:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baf849d27fd1132833832734ff5b1648b7401d53925a624176832bca614d1160
    source_path: install/updating.md
    workflow: 16
---

Mantenha o OpenClaw atualizado.

Para substituições de imagens do Docker, Podman e Kubernetes, consulte
[Atualização de imagens de contêiner](/pt-BR/install/docker#upgrading-container-images). O
Gateway executa tarefas de atualização seguras para a inicialização antes de ficar pronto e encerra se o estado
montado precisar de reparo manual.

## Recomendado: `openclaw update`

Detecta o tipo de instalação (npm, pnpm, Bun ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Alterne os canais ou especifique uma versão:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # visualização sem aplicar
```

`openclaw update` não tem a opção `--verbose` (o instalador tem). Para diagnósticos, use
`--dry-run` para visualizar as ações planejadas, `--json` para obter resultados estruturados ou
`openclaw update status --json` para inspecionar o estado do canal e da disponibilidade.

`--channel beta` dá preferência à dist-tag beta do npm, mas recorre a stable/latest
quando a tag beta está ausente ou sua versão é anterior à versão estável
mais recente. Em vez disso, use `--tag beta` para uma atualização avulsa do pacote fixada à dist-tag
beta bruta do npm.

`--channel extended-stable` é exclusivo para pacotes, e a instalação continua sendo
executada somente em primeiro plano. O OpenClaw lê o seletor público `extended-stable` do npm,
verifica o pacote exato selecionado e instala essa versão exata. Dados ausentes
ou inconsistentes no registro causam uma falha segura; nunca há fallback para `latest`.
Se a versão selecionada for anterior à versão instalada, a confirmação normal
de downgrade ainda será aplicada. A CLI mantém o canal após uma
atualização bem-sucedida do núcleo; uma execução direta de `npm install -g openclaw@extended-stable`
não atualiza `update.channel`.
Após a substituição do núcleo, os plugins npm oficiais elegíveis com intenção
bare/default ou `latest` convergem para essa versão exata do núcleo. Fixações exatas e tags
não `latest` explícitas, plugins de terceiros e fontes que não sejam npm permanecem inalterados.
As instalações de catálogo criadas pelas versões atuais do OpenClaw mantêm essa intenção
padrão. Registros mais antigos que contêm apenas uma versão exata permanecem fixados porque
o OpenClaw não consegue distinguir com segurança uma fixação automática antiga de uma fixação do usuário; execute
`openclaw plugins update @openclaw/name` uma vez no canal extended-stable
para fazer esse plugin voltar a acompanhar exatamente o núcleo.

`--channel dev` fornece um checkout persistente e móvel de `main` do GitHub. Para uma atualização
avulsa do pacote, `--tag main` é mapeado para a especificação de pacote `github:openclaw/openclaw#main`
e instalado diretamente pelo gerenciador de pacotes de destino (npm/pnpm/bun).

Para plugins gerenciados, a ausência de uma versão beta gera um aviso, não uma falha: a
atualização do núcleo ainda pode ser bem-sucedida enquanto um plugin recorre à sua versão
default/latest registrada.

Consulte [Canais de lançamento](/pt-BR/install/development-channels) para conhecer a semântica dos canais.

## Alternar entre instalações npm e git

Use canais para alterar o tipo de instalação. O atualizador mantém seu estado, configuração,
credenciais e espaço de trabalho em `~/.openclaw`; ele altera apenas qual instalação do código do OpenClaw
é usada pela CLI e pelo Gateway.

```bash
# instalação do pacote npm -> checkout git editável
openclaw update --channel dev

# checkout git -> instalação do pacote npm
openclaw update --channel stable
```

Primeiro, visualize a mudança do modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garante um checkout git, faz sua compilação e instala a CLI global a partir desse
checkout. Os canais `stable`, `extended-stable` e `beta` usam instalações de
pacotes. Extended-stable é rejeitado em um checkout git sem modificá-lo nem
convertê-lo. Se o Gateway já estiver instalado, `openclaw update` atualiza
os metadados do serviço e o reinicia, a menos que `--no-restart` seja informado.

Para instalações de pacotes com um serviço de Gateway gerenciado, `openclaw update` usa como destino
a raiz do pacote utilizada por esse serviço. Se o comando de shell `openclaw` vier
de outra instalação, o atualizador exibirá ambas as raízes e o caminho do Node do
serviço gerenciado, além de verificar essa versão do Node em relação ao requisito
`engines.node` da versão de destino antes de substituir o pacote.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar a integração inicial. Para forçar um tipo específico de instalação, informe
`--install-method git --no-onboard` ou `--install-method npm --no-onboard`.

Se `openclaw update` falhar após a fase de instalação do pacote npm, execute o
instalador novamente. Ele não chama o atualizador; executa diretamente a instalação global
do pacote e pode recuperar uma instalação npm parcialmente atualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Fixe a recuperação em uma versão ou dist-tag específica com `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm ou bun manual

```bash
npm i -g openclaw@latest
```

Prefira `openclaw update` para instalações supervisionadas: ele pode coordenar a substituição do pacote
com o serviço do Gateway em execução. Se você atualizar manualmente uma instalação supervisionada,
primeiro interrompa o Gateway gerenciado. Os gerenciadores de pacotes substituem os arquivos no
local, e um Gateway em execução poderia tentar carregar arquivos do núcleo ou de plugins
durante a substituição. Reinicie o Gateway após a conclusão do gerenciador de pacotes para que ele carregue
a nova instalação.

Para uma instalação global de sistema no Linux pertencente ao root, se `openclaw update` falhar com
`EACCES`, faça a recuperação com o npm do sistema enquanto mantém o Gateway interrompido para a
substituição manual. Use as mesmas opções de perfil e variáveis de ambiente que costuma usar para
esse Gateway. Substitua `/usr/bin/npm` pelo npm do sistema responsável pelo
prefixo global pertencente ao root em seu host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Em seguida, verifique:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Quando `openclaw update` gerencia uma instalação npm global, ele primeiro instala o destino
em um prefixo npm temporário. O pacote candidato valida a versão do Node do host
durante `preinstall`; somente então o OpenClaw verifica o inventário
`dist` empacotado e substitui a árvore limpa do pacote no prefixo global real. Uma
proteção de conclusão empacotada é omitida do inventário esperado e removida somente
após o êxito de `preinstall`, de modo que scripts de ciclo de vida ignorados também causem falha antes da
substituição. No npm 12 e versões posteriores, o atualizador aprova somente o ciclo de vida do OpenClaw
candidato; scripts de dependências transitivas permanecem bloqueados. Isso impede que o npm
sobreponha um novo pacote a arquivos obsoletos do anterior. Se o comando de
instalação falhar, o OpenClaw tentará novamente uma vez com `--omit=optional`, o que ajuda em hosts
onde dependências opcionais nativas não podem ser compiladas.

Os comandos de atualização do npm e de atualização de plugins gerenciados pelo OpenClaw também removem a
quarentena de cadeia de suprimentos `min-release-age` do npm (ou a chave de configuração
mais antiga `before`) para o processo filho do npm. Essa política existe para proteção
geral, mas uma atualização explícita do OpenClaw significa "instalar a versão selecionada agora".

```bash
pnpm add -g openclaw@latest
```

Se o pnpm 11 instalou o OpenClaw 2026.7.1, execute esse comando manual uma vez. Essa
versão é anterior ao layout isolado de pacotes globais do pnpm 11, portanto seu atualizador pode
confundir outra instalação npm com a CLI em execução. Versões posteriores mantêm
a propriedade do pnpm e acompanham a raiz do pacote substituto durante as atualizações. Elas
também usam o diretório bin global informado pelo gerenciador responsável e interrompem antes
de qualquer modificação quando o comando pnpm disponível informa outra raiz global ou versão principal,
ou quando o pacote invocador está órfão ou não é a única instalação ativa do OpenClaw
nesse local.

Se o OpenClaw compartilhar um grupo de instalação global do pnpm 11 com outro pacote, o
atualizador automático será interrompido antes de alterar o grupo. Atualize manualmente o grupo original
separado por vírgulas para manter intactos os pacotes relacionados e a política de compilação.

```bash
bun add -g openclaw@latest
```

### Tópicos avançados de instalação com npm

<AccordionGroup>
  <Accordion title="Árvore de pacotes somente leitura">
    O OpenClaw trata instalações globais empacotadas como somente leitura durante a execução, mesmo quando o diretório global de pacotes pode ser gravado pelo usuário atual. As instalações de pacotes de plugins residem em raízes npm/git pertencentes ao OpenClaw no diretório de configuração do usuário, e a inicialização do Gateway não modifica a árvore de pacotes do OpenClaw.

    Algumas configurações do npm no Linux instalam pacotes globais em diretórios pertencentes ao root, como `/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout porque os comandos de instalação e atualização de plugins gravam fora desse diretório global de pacotes.

  </Accordion>
  <Accordion title="Unidades systemd reforçadas">
    Conceda ao OpenClaw acesso de gravação às raízes de configuração/estado para que instalações explícitas de plugins, atualizações de plugins e limpezas do doctor possam persistir suas alterações:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Verificação prévia de espaço em disco">
    Antes de atualizações de pacotes e instalações explícitas de plugins, o OpenClaw tenta realizar uma verificação de melhor esforço do espaço em disco do volume de destino. Pouco espaço gera um aviso com o caminho verificado, mas não bloqueia a atualização, pois cotas do sistema de arquivos, snapshots e volumes de rede podem mudar após a verificação. A instalação efetiva pelo gerenciador de pacotes e a verificação pós-instalação continuam sendo definitivas.
  </Accordion>
</AccordionGroup>

## Atualizador automático

Desativado por padrão. Ative-o em `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal             | Comportamento                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Aguarda `stableDelayHours` (padrão: 6) e aplica com uma variação determinística ao longo de `stableJitterHours` (padrão: 12) para uma implantação distribuída. |
| `extended-stable` | Verifica uma indicação de atualização somente leitura na inicialização e a cada 24 horas quando `checkOnStart` está ativado. Nunca aplica automaticamente. |
| `beta`            | Verifica a cada `betaCheckIntervalHours` (padrão: 1) e aplica imediatamente.                                                                 |
| `dev`             | Nenhuma aplicação automática. Use `openclaw update` manualmente.                                                                            |

O Gateway também registra uma indicação de atualização na inicialização (desative com
`update.checkOnStart: false`). As seleções extended-stable armazenadas usam esse
caminho de indicação somente leitura e o intervalo existente de 24 horas, mas nunca invocam
instalação automática, transferência, reinicialização, atraso/variação de stable ou consulta de beta.
Para downgrade ou recuperação de incidentes, defina `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway para bloquear aplicações automáticas mesmo quando `update.auto.enabled` estiver configurado. As indicações de atualização na inicialização ainda poderão ser executadas, a menos que `update.checkOnStart` também esteja desativado.

As atualizações do gerenciador de pacotes solicitadas pelo plano de controle ativo do Gateway
(`update.run`) não substituem a árvore de pacotes dentro do processo do Gateway em
execução. Em instalações de serviços gerenciados, o Gateway inicia uma transferência desvinculada,
encerra e permite que o caminho normal da CLI `openclaw update --yes --json` interrompa o
serviço, substitua o pacote, atualize os metadados do serviço, reinicie, verifique a
versão e a acessibilidade do Gateway e recupere, quando possível, um LaunchAgent do macOS
instalado, mas não carregado. Se o Gateway não puder realizar essa transferência com segurança,
`update.run` informará um comando de shell seguro em vez de executar o gerenciador
de pacotes no processo.

O cartão de atualização da barra lateral da interface de controle mostra **Atualizar Gateway** quando inicia
este fluxo `update.run` diretamente. Isso abrange a interface de controle hospedada no navegador, Gateways
remotos e Gateways locais gerenciados manualmente.

No aplicativo assinado para macOS, um Gateway local pertencente ao aplicativo altera esse cartão para
**Atualizar aplicativo para Mac + Gateway**. O Sparkle atualiza primeiro o aplicativo; após a reinicialização, o
aplicativo executa `openclaw update --tag <app-version> --json`, reinicia seu Gateway
e verifica a integridade em uma janela de progresso semelhante à de configuração. A janela aparece somente
quando esse Gateway gerenciado precisa de atualização, reparo ou instalação; atualizações apenas do aplicativo reiniciam
diretamente no aplicativo. Os detalhes da falha permanecem visíveis com as ações Tentar novamente, [Guia de atualização](/pt-BR/install/updating) e
[Discord](https://discord.gg/clawd). O aplicativo nunca usa esse caminho coordenado
para um Gateway remoto ou gerenciado externamente, nunca rebaixa um
Gateway mais recente e nunca substitui uma fixação de canal `extended-stable`.

Quando a atualização é bem-sucedida, o aplicativo enfileira um evento de boas-vindas único para a
sessão direta de nível superior mais recente com uma interação real de usuário/canal. Execuções do Cron,
heartbeats e atualizações de sessão apenas em segundo plano não alteram essa seleção. No
modo remoto, o aplicativo atualiza somente o runtime do Node local do Mac e envia o evento
somente quando o Gateway remoto conectado é pelo menos tão recente quanto o aplicativo.

## Após a atualização

<Steps>

### Execute o doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a integridade do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reinicie o Gateway

```bash
openclaw gateway restart
```

### Verifique

```bash
openclaw health
```

</Steps>

## Reversão

A reversão tem duas camadas:

1. Reinstale o código antigo do OpenClaw mantendo o estado atual.
2. Restaure o estado anterior à atualização somente quando o código antigo não puder usar uma
   configuração ou um banco de dados migrado.

Comece com uma reversão apenas do código. A restauração do estado descarta as alterações feitas após
o backup.

### Antes da atualização: crie um backup verificado

`openclaw update` preserva uma cópia automática da configuração anterior à atualização, mas não
cria um ponto completo de recuperação do estado. Antes de uma atualização significativa, crie um
explicitamente:

```bash
mkdir -p ~/Backups/openclaw
openclaw backup create --output ~/Backups/openclaw --verify
```

O manifesto do arquivo registra a versão do OpenClaw e os caminhos de origem incluídos
no backup. O arquivo pode conter credenciais, perfis de autenticação e estado de
canais, portanto, armazene-o com permissões exclusivas do proprietário e a mesma proteção do
diretório de estado ativo. Consulte [Backup](/pt-BR/cli/backup) para ver os arquivos incluídos e intencionalmente
omitidos.

Para obter um ponto de recuperação byte a byte que inclua artefatos voláteis omitidos pelo
arquivo portátil, interrompa o Gateway e use um snapshot do sistema de arquivos, volume ou VM
fornecido pela sua plataforma.

### Reverta uma instalação de pacote

Liste as versões publicadas e, em seguida, visualize e instale a versão confiável:

```bash
npm view openclaw versions --json
openclaw update --tag <known-good-version> --dry-run
openclaw update --tag <known-good-version>
```

`openclaw update --tag` é preferível a uma instalação direta pelo gerenciador de pacotes. Ele
detecta o downgrade, solicita confirmação, executa a convergência gerenciada de plugins
e verificações de compatibilidade em relação ao destino instalado, atualiza os metadados
do serviço, reinicia o Gateway e verifica a versão em execução. Se o canal armazenado
for `extended-stable`, use
`--channel stable --tag <known-good-version>`, pois tags exatas de uso único não podem
ser combinadas com o seletor `extended-stable`.

As atualizações de pacote preparam e verificam o candidato antes da ativação. Se a
troca no sistema de arquivos ou a substituição do shim de comando falhar, o OpenClaw restaura automaticamente o
pacote antigo. Após uma troca bem-sucedida, uma falha posterior na integridade do Gateway
informa a versão anterior e as instruções de reversão manual, em vez de
substituir automaticamente o pacote novamente.

Se o caminho de atualização da CLI não estiver disponível, use o mesmo gerenciador de pacotes e escopo
de instalação responsáveis pelo Gateway atual:

```bash
openclaw gateway stop
npm i -g openclaw@<known-good-version>
openclaw gateway install --force
openclaw gateway restart
```

Substitua `npm` por `pnpm` ou `bun` quando esse gerenciador for responsável pela instalação. Durante
a recuperação de incidentes, impeça que um atualizador automático habilitado aplique imediatamente uma
versão mais recente definindo `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway.

### Reverta um checkout do código-fonte

Use um checkout limpo e selecione uma tag ou um commit confiável:

```bash
git fetch --all --tags
git checkout --detach <known-good-tag-or-commit>
pnpm install && pnpm build
openclaw gateway restart
```

Para retornar à versão mais recente: `git checkout main && git pull`.

O atualizador retorna automaticamente um checkout do Git ao branch e
SHA anteriores quando a instalação de dependências, a compilação, a compilação da interface ou o doctor falha após o início de uma
atualização do Git. O checkout manual ainda é necessário quando você escolhe intencionalmente
um commit antigo.

### Downgrade entre versões durante a migração de sessões para SQLite

Antes de iniciar uma versão antiga do OpenClaw baseada em arquivos, use a CLI atual para
restaurar os artefatos arquivados de transcrições legadas:

```bash
openclaw gateway stop
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Isso não exclui dados do SQLite. As sessões criadas após a migração para SQLite
existem somente no SQLite e não aparecerão no runtime antigo. Consulte
[Downgrade após a migração de sessões para SQLite](/pt-BR/cli/doctor#downgrading-after-session-sqlite-migration).

### Restaure o estado somente quando necessário

Se o código antigo não puder ler uma configuração ou um esquema de banco de dados mais recente, interrompa o
Gateway e restaure o snapshot verificado do sistema de arquivos, volume ou VM anterior à atualização.
Preserve separadamente o estado atual antes da restauração, pois isso remove
as alterações feitas após o snapshot.

Arquivos abrangentes `openclaw backup create` permitem criação e verificação, mas
não a ativação local do arquivo completo. Extraia um arquivo abrangente em um diretório
de preparação e use seu mapeamento `manifest.json` da origem para o arquivo para uma restauração
offline. Da mesma forma, `openclaw backup sqlite restore` grava um banco de dados verificado
em um novo destino; a ativação desse destino continua sendo uma etapa offline explícita do operador.

### Verifique a reversão

```bash
openclaw --version
openclaw health
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

## Se tiver problemas

- Execute `openclaw doctor` novamente e leia atentamente a saída.
- Para `openclaw update --channel dev` em checkouts do código-fonte, o atualizador inicializa automaticamente `pnpm` quando necessário. Se ocorrer um erro de inicialização do pnpm/corepack, instale `pnpm` manualmente (ou reative `corepack`) e execute novamente a atualização.
- Consulte: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionados

- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificações de integridade após atualizações.
- [Migração](/pt-BR/install/migrating): guias de migração entre versões principais.
