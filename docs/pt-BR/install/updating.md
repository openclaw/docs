---
read_when:
    - Atualizando o OpenClaw
    - Algo deixa de funcionar após uma atualização
summary: Atualização segura do OpenClaw (instalação global ou a partir do código-fonte), além da estratégia de reversão
title: Atualizando
x-i18n:
    generated_at: "2026-07-12T15:23:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

Mantenha o OpenClaw atualizado.

Para substituições de imagens do Docker, Podman e Kubernetes, consulte
[Atualização de imagens de contêiner](/pt-BR/install/docker#upgrading-container-images). O
Gateway executa tarefas de atualização seguras para a inicialização antes de ficar pronto e encerra se o
estado montado precisar de reparo manual.

## Recomendado: `openclaw update`

Detecta o tipo de instalação (npm ou git), obtém a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Alterne entre canais ou selecione uma versão específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # visualização sem aplicar
```

`openclaw update` não tem a opção `--verbose` (o instalador tem). Para diagnósticos, use
`--dry-run` para visualizar as ações planejadas, `--json` para obter resultados estruturados ou
`openclaw update status --json` para inspecionar o estado do canal e da disponibilidade.

`--channel beta` prioriza a dist-tag beta do npm, mas recorre a stable/latest
quando a tag beta está ausente ou sua versão é anterior à versão estável mais
recente. Em vez disso, use `--tag beta` para uma atualização avulsa do pacote fixada na
dist-tag beta bruta do npm.

`--channel extended-stable` funciona somente com pacotes, e a instalação permanece
apenas em primeiro plano. O OpenClaw lê o seletor público `extended-stable` do npm,
verifica o pacote exato selecionado e instala essa versão exata. Dados ausentes
ou inconsistentes do registro causam uma falha segura; nunca há fallback para `latest`.
Se a versão selecionada for anterior à versão instalada, a confirmação normal
de downgrade ainda será aplicada. A CLI persiste o canal após uma atualização
bem-sucedida do núcleo; uma execução direta de `npm install -g openclaw@extended-stable`
não atualiza `update.channel`.
Após a substituição do núcleo, os plugins npm oficiais qualificados com intenção
vazia/padrão ou `latest` convergem para essa versão exata do núcleo. Fixações exatas e tags
explícitas diferentes de `latest`, plugins de terceiros e fontes que não sejam npm permanecem inalterados.
As instalações do catálogo criadas pelas versões atuais do OpenClaw mantêm essa intenção
padrão. Registros mais antigos que contêm apenas uma versão exata permanecem fixados porque
o OpenClaw não consegue distinguir com segurança uma fixação automática antiga de uma fixação feita pelo usuário; execute
`openclaw plugins update @openclaw/name` uma vez no canal extended-stable
para fazer esse plugin voltar a acompanhar exatamente a versão do núcleo.

`--channel dev` fornece um checkout persistente e móvel da `main` do GitHub. Para uma atualização
avulsa do pacote, `--tag main` é mapeado para a especificação de pacote
`github:openclaw/openclaw#main` e a instala diretamente pelo gerenciador de pacotes de destino (npm/pnpm/bun).

Para plugins gerenciados, a ausência de uma versão beta gera um aviso, não uma falha: a
atualização do núcleo ainda pode ser concluída enquanto um plugin recorre à sua versão
padrão/latest registrada.

Consulte [Canais de lançamento](/pt-BR/install/development-channels) para conhecer a semântica dos canais.

## Alternar entre instalações npm e git

Use canais para alterar o tipo de instalação. O atualizador mantém seu estado, configuração,
credenciais e espaço de trabalho em `~/.openclaw`; ele altera apenas qual instalação do código
do OpenClaw é usada pela CLI e pelo Gateway.

```bash
# instalação do pacote npm -> checkout git editável
openclaw update --channel dev

# checkout git -> instalação do pacote npm
openclaw update --channel stable
```

Primeiro, visualize a troca do modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` garante um checkout git, faz o build e instala a CLI global a partir desse
checkout. Os canais `stable`, `extended-stable` e `beta` usam instalações de
pacotes. O extended-stable é rejeitado em um checkout git sem modificá-lo nem
convertê-lo. Se o Gateway já estiver instalado, `openclaw update` atualiza
os metadados do serviço e o reinicia, a menos que você passe `--no-restart`.

Para instalações de pacotes com um serviço Gateway gerenciado, `openclaw update` usa como destino
a raiz do pacote utilizada por esse serviço. Se o comando `openclaw` do shell vier
de outra instalação, o atualizador exibe as duas raízes e o caminho do Node
do serviço gerenciado, além de verificar essa versão do Node em relação ao requisito
`engines.node` da versão de destino antes de substituir o pacote.

## Alternativa: executar novamente o instalador

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para ignorar a integração inicial. Para forçar um tipo específico de instalação, passe
`--install-method git --no-onboard` ou `--install-method npm --no-onboard`.

Se `openclaw update` falhar após a fase de instalação do pacote npm, execute novamente o
instalador. Ele não chama o atualizador; executa diretamente a instalação global do
pacote e pode recuperar uma instalação npm parcialmente atualizada.

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
com o serviço Gateway em execução. Se você atualizar manualmente uma instalação
supervisionada, primeiro interrompa o Gateway gerenciado. Os gerenciadores de pacotes substituem os arquivos
no local, e um Gateway em execução pode tentar carregar arquivos do núcleo ou de plugins
durante a substituição. Reinicie o Gateway após o gerenciador de pacotes terminar para que ele
use a nova instalação.

Para uma instalação global do sistema Linux pertencente ao root, se `openclaw update` falhar com
`EACCES`, faça a recuperação com o npm do sistema, mantendo o Gateway interrompido durante a
substituição manual. Use as mesmas opções de perfil/ambiente normalmente usadas para
esse Gateway. Substitua `/usr/bin/npm` pelo npm do sistema que controla o
prefixo global pertencente ao root no seu host:

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

Quando `openclaw update` gerencia uma instalação global do npm, ele primeiro instala o destino
em um prefixo temporário do npm, verifica o inventário de `dist` do pacote e depois
substitui a árvore limpa do pacote no prefixo global real — evitando que o npm
sobreponha um novo pacote a arquivos obsoletos do anterior. Se o comando de instalação
falhar, o OpenClaw tentará novamente uma vez com `--omit=optional`, o que ajuda em hosts
nos quais dependências opcionais nativas não podem ser compiladas.

Os comandos de atualização do npm e de atualização de plugins gerenciados pelo OpenClaw também limpam a
quarentena da cadeia de suprimentos `min-release-age` do npm (ou a chave de configuração
mais antiga `before`) para o processo npm filho. Essa política existe para proteção geral, mas uma
atualização explícita do OpenClaw significa “instalar agora a versão selecionada”.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Tópicos avançados de instalação com npm

<AccordionGroup>
  <Accordion title="Árvore de pacotes somente leitura">
    O OpenClaw trata instalações globais empacotadas como somente leitura durante a execução, mesmo quando o diretório global do pacote permite gravação pelo usuário atual. As instalações de pacotes de plugins ficam em raízes npm/git pertencentes ao OpenClaw no diretório de configuração do usuário, e a inicialização do Gateway não modifica a árvore de pacotes do OpenClaw.

    Algumas configurações do npm no Linux instalam pacotes globais em diretórios pertencentes ao root, como `/usr/lib/node_modules/openclaw`. O OpenClaw é compatível com essa disposição porque os comandos de instalação/atualização de plugins gravam fora desse diretório global de pacotes.

  </Accordion>
  <Accordion title="Unidades systemd reforçadas">
    Conceda ao OpenClaw acesso de gravação às suas raízes de configuração/estado para que instalações explícitas de plugins, atualizações de plugins e limpezas do doctor possam persistir suas alterações:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Verificação preliminar de espaço em disco">
    Antes de atualizações de pacotes e instalações explícitas de plugins, o OpenClaw tenta realizar uma verificação de melhor esforço do espaço em disco do volume de destino. Pouco espaço gera um aviso com o caminho verificado, mas não bloqueia a atualização porque cotas do sistema de arquivos, snapshots e volumes de rede podem mudar após a verificação. A instalação efetiva pelo gerenciador de pacotes e a verificação pós-instalação continuam sendo a fonte de verdade.
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

| Canal             | Comportamento                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | Aguarda `stableDelayHours` (padrão: 6) e então aplica com variação determinística ao longo de `stableJitterHours` (padrão: 12) para uma implantação distribuída.                         |
| `extended-stable` | Verifica uma indicação de atualização somente leitura na inicialização e a cada 24 horas quando `checkOnStart` está ativado. Nunca aplica automaticamente.                              |
| `beta`            | Verifica a cada `betaCheckIntervalHours` (padrão: 1) e aplica imediatamente.                                                                                                             |
| `dev`             | Não há aplicação automática. Use `openclaw update` manualmente.                                                                                                                         |

O Gateway também registra uma indicação de atualização na inicialização (desative com
`update.checkOnStart: false`). As seleções extended-stable armazenadas usam esse
caminho de indicação somente leitura e o intervalo existente de 24 horas, mas nunca invocam
instalação automática, transferência, reinicialização, atraso/variação do canal stable nem sondagem do beta.
Para downgrade ou recuperação de incidentes, defina `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway para bloquear aplicações automáticas mesmo quando `update.auto.enabled` estiver configurado. As indicações de atualização na inicialização ainda podem ser executadas, a menos que `update.checkOnStart` também esteja desativado.

As atualizações do gerenciador de pacotes solicitadas pelo plano de controle do Gateway ativo
(`update.run`) não substituem a árvore de pacotes dentro do processo do Gateway
em execução. Em instalações de serviço gerenciado, o Gateway inicia uma transferência desacoplada,
encerra e permite que o fluxo normal da CLI `openclaw update --yes --json` interrompa o
serviço, substitua o pacote, atualize os metadados do serviço, reinicie, verifique a
versão e a acessibilidade do Gateway e recupere, quando possível, um LaunchAgent do macOS
instalado, mas não carregado. Se o Gateway não puder realizar essa transferência com segurança,
`update.run` informa um comando de shell seguro em vez de executar o gerenciador de
pacotes dentro do processo.

O cartão de atualização da barra lateral da Control UI inicia esse mesmo fluxo de `update.run`. No
aplicativo assinado do macOS, o cartão primeiro atualiza o aplicativo pelo Sparkle; após reiniciar,
o aplicativo ajusta seu Gateway local gerenciado para a versão correspondente.

## Após a atualização

<Steps>

### Executar o doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de MD e verifica a integridade do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reiniciar o Gateway

```bash
openclaw gateway restart
```

### Verificar

```bash
openclaw health
```

</Steps>

## Reversão

### Fixar uma versão (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra a versão publicada atual.
</Tip>

### Fixar um commit (código-fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para retornar à versão mais recente: `git checkout main && git pull`.

## Se você estiver com dificuldades

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts do código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você encontrar um erro de inicialização do pnpm/corepack, instale o `pnpm` manualmente (ou reative o `corepack`) e execute a atualização novamente.
- Consulte: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Peça ajuda no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionados

- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificações de integridade após atualizações.
- [Migração](/pt-BR/install/migrating): guias de migração entre versões principais.
