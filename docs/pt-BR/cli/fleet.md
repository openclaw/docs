---
read_when:
    - Você hospeda vários domínios de confiança de locatários em uma única máquina
    - Você precisa criar, inspecionar, atualizar ou remover células da frota
summary: Referência da CLI para provisionar e gerenciar células isoladas do OpenClaw por locatário
title: Frota
x-i18n:
    generated_at: "2026-07-12T15:04:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160c1242073f506c2a2f98481f4ec933a073fd3da0bc20c4cee3e146a38e293
    source_path: cli/fleet.md
    workflow: 16
---

# `openclaw fleet`

O `openclaw fleet` gerencia instâncias completas do OpenClaw chamadas **células**. Cada célula tem seu próprio Gateway, estado, credenciais, contas de canais, contêiner e porta do host acessível apenas por loopback. Use uma célula para cada limite de confiança de locatário; não use um único Gateway compartilhado como limite multilocatário hostil.

O Fleet é **experimental**. Nomes de comandos, sinalizadores, formatos de saída e o perfil do contêiner podem mudar entre versões sem um período de descontinuação enquanto essa interface se estabiliza.

O Fleet é compatível com Docker e Podman. A imagem padrão é `ghcr.io/openclaw/openclaw:latest`.

O Fleet é testado em hosts Linux e macOS. Atualmente, hosts Windows não foram testados.

## Início rápido

```bash
openclaw fleet create acme
openclaw fleet status acme
openclaw fleet list
```

O `fleet create` exibe uma única vez o token gerado do Gateway, junto com a URL da célula. Armazene o token imediatamente e, depois, configure as contas de canais de cada locatário dentro da célula desse locatário.

## IDs de locatários

Os IDs de locatários devem corresponder a:

```text
^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$
```

Isso permite de 1 a 40 letras minúsculas, dígitos e hifens internos. Um ID deve começar e terminar com uma letra ou um dígito. Letras maiúsculas, sublinhados, barras, pontos, espaços em branco e strings de travessia como `../acme` são rejeitados.

O ID passa a fazer parte do nome do contêiner: `openclaw-cell-<tenant>`.

## `fleet create`

Crie uma célula e inicie-a:

```bash
openclaw fleet create acme
```

Crie uma célula do Podman em uma porta fixa sem iniciá-la:

```bash
openclaw fleet create acme \
  --runtime podman \
  --port 19125 \
  --no-start
```

Passe variáveis de ambiente específicas do locatário repetindo `--env`:

```bash
openclaw fleet create acme \
  --env TZ=America/Los_Angeles \
  --env OPENCLAW_DISABLE_BONJOUR=1
```

As chaves de ambiente usam letras, dígitos e sublinhados e não podem começar com um dígito. Os valores devem estar em uma única linha porque o Fleet os passa por meio de um arquivo de ambiente protegido do runtime. O Fleet rejeita tentativas de substituir as variáveis gerenciadas de caminho do contêiner e de token do Gateway listadas em [Armazenamento e layout do contêiner](#storage-and-container-layout).

### Opções de criação

| Opção                     | Padrão                                      | Descrição                                                                                                                  |
| ------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--image <ref>`           | `ghcr.io/openclaw/openclaw:latest`          | Imagem do contêiner da célula.                                                                                             |
| `--runtime <runtime>`     | `docker`                                    | CLI de contêiner: `docker` ou `podman`.                                                                                    |
| `--port <number>`         | Alocada automaticamente a partir de `19100` | Porta de loopback do host. Uma porta selecionada explicitamente não deve pertencer a outra célula registrada.              |
| `--memory <value>`        | `2g`                                        | Limite de memória do contêiner na sintaxe do Docker/Podman.                                                                |
| `--cpus <value>`          | `2`                                         | Limite de CPU do contêiner.                                                                                                |
| `--disk <size>`           | Nenhum                                      | Limita a camada gravável do contêiner quando o backend de armazenamento oferece suporte a cotas.                           |
| `--network <mode>`        | `bridge`                                    | Modo de rede de saída: `bridge` ou `internal`.                                                                             |
| `--pids-limit <number>`   | `512`                                       | Número máximo de processos no contêiner.                                                                                   |
| `--env <KEY=VALUE>`       | Nenhum                                      | Passa uma variável de ambiente para a célula. Repita para vários valores.                                                   |
| `--gateway-token <value>` | Token hexadecimal aleatório de 32 caracteres | Usa um token do Gateway fornecido em vez de gerar um. Consulte [Tratamento de tokens](#token-handling).                    |
| `--no-start`              | A célula é iniciada                         | Cria o contêiner sem iniciá-lo.                                                                                            |
| `--json`                  | Saída legível por humanos                   | Exibe uma saída legível por máquina.                                                                                       |

A alocação automática seleciona a primeira porta não utilizada no registro que seja igual ou superior a `19100`. O Fleet rejeita IDs de locatários duplicados e portas explícitas já atribuídas a outra célula.

As referências de imagem são passadas como um único argumento para o runtime de contêiner. Referências vazias e valores que começam com `-` são rejeitados para impedir que uma imagem seja interpretada como uma opção do Docker ou Podman.

O endpoint selecionado do Docker ou Podman deve ser local. O Fleet rejeita contextos remotos do Docker, endpoints `DOCKER_HOST` e serviços remotos do Podman antes de reservar uma porta ou criar estado local; hosts remotos de células precisam de um contrato separado de armazenamento e endpoint e estão fora deste MVP.

Quando o Fleet inicia uma nova célula, a criação aguarda por até cerca de um minuto que o Gateway responda a `/healthz`. Se a célula não ficar íntegra, o Fleet mantém o contêiner e a linha do registro intactos para `fleet status`, `fleet logs` ou remoção explícita. `--no-start` ignora essa verificação de integridade. O token gerado do Gateway de uma nova célula que não ficou íntegra não é perdido — ele permanece no ambiente do contêiner (`docker|podman inspect`) e, como a célula ainda não atendeu nenhum tráfego, executar `fleet rm --force` seguido por uma nova criação é sempre uma alternativa segura.

### Fixação por digest

Os comandos de criação e atualização aceitam referências de imagem fixadas por digest, como `--image ghcr.io/openclaw/openclaw@sha256:<digest>`. O Fleet passa a referência da imagem literalmente para o Docker ou Podman, o que permite que um operador mantenha uma célula em bytes imutáveis da imagem, em vez de usar uma tag variável.

O resultado da criação inclui o ID do locatário, o nome do contêiner, a porta do host, o token do Gateway e a URL local. Mesmo na saída JSON, trate o resultado como contendo informações secretas, pois ele inclui o token.

### Limites de disco

`--disk` limita apenas a camada gravável do contêiner. Os diretórios de estado e autenticação de cada locatário, montados por bind, permanecem no armazenamento do host; use cotas de projeto do sistema de arquivos do host quando esses diretórios também precisarem de um limite rígido.

| Backend de runtime/armazenamento | Compatibilidade com `--disk`                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Docker overlay2 em XFS           | Requer a opção de montagem `pquota` do XFS.                                                      |
| Docker btrfs ou zfs              | Compatível por meio do driver de armazenamento.                                                  |
| Podman overlay                   | Requer armazenamento subjacente em XFS.                                                         |
| Outros backends                  | A criação do contêiner falha com o erro do daemon e as orientações de backend fornecidas pelo Fleet. |

### Política de saída

| Modo       | Docker                                                                                                                    | Podman                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `bridge`   | Compatível; o tráfego de saída é irrestrito por padrão.                                                                   | Compatível; o tráfego de saída é irrestrito por padrão.                                        |
| `internal` | Rejeitado porque o Docker não preserva a porta de loopback publicada do Gateway em uma rede interna.                      | Compatível; o Gateway de loopback permanece publicado enquanto o tráfego de saída é bloqueado. |

Para o Docker, mantenha o modo bridge e aplique a política de saída com regras do firewall do host, como a cadeia `DOCKER-USER`.

## `fleet list`

Liste as células na ordem dos IDs de locatários:

```bash
openclaw fleet list
openclaw fleet ls
openclaw fleet list --json
```

A tabela contém:

| Coluna    | Significado                                                                                                                                                                                                                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant`  | ID do locatário.                                                                                                                                                                                                                                                                                                          |
| `state`   | Estado ativo do contêiner obtido pela inspeção do Docker ou Podman. `unknown` significa que o runtime estava indisponível ou que existe um contêiner com o nome da célula, mas seus rótulos de propriedade do Fleet não correspondem ao registro (um sinal de colisão ou adulteração — inspecione-o manualmente antes de agir). |
| `port`    | Porta de loopback do host mapeada para o Gateway da célula.                                                                                                                                                                                                                                                               |
| `image`   | Imagem registrada do contêiner.                                                                                                                                                                                                                                                                                            |
| `created` | Horário de criação da célula.                                                                                                                                                                                                                                                                                              |

As linhas do registro permanecem visíveis quando o Docker ou Podman está indisponível; apenas o estado ativo passa a ser `unknown`.

## `fleet status`

Inspecione uma célula:

```bash
openclaw fleet status acme
openclaw fleet status acme --json
```

O status combina a linha do registro do Fleet, a inspeção ativa do contêiner e uma breve solicitação de melhor esforço para:

```text
http://127.0.0.1:<host-port>/healthz
```

O resultado da verificação de integridade é `ok`, `failed` ou `skipped`. `/healthz` comprova que o Gateway está ativo, não que todos os canais ou plugins configurados estejam totalmente prontos. A sondagem é ignorada quando não há um endpoint local utilizável para verificar.

## `fleet logs`

Transmita os logs do contêiner de uma célula diretamente para o terminal:

```bash
openclaw fleet logs acme
openclaw fleet logs acme --follow
openclaw fleet logs acme --tail 200
openclaw fleet logs acme --since 10m
```

O Fleet verifica os rótulos de propriedade do contêiner registrado antes de ler qualquer log e, portanto, recusa um contêiner externo que use o nome esperado da célula. Pressione Ctrl-C para encerrar `--follow` sem tratar a interrupção do operador como uma falha do comando. A saída de log passa por um filtro de ocultação que substitui o token atual do Gateway da célula por `<redacted>` antes que qualquer conteúdo chegue ao terminal.

O `fleet logs` não tem o modo `--json` porque os logs do contêiner são um fluxo bruto de stdout/stderr. Para scripts, limite a saída com `--tail` e use redirecionamentos ou pipelines comuns do shell.

## `fleet start`, `fleet stop` e `fleet restart`

Controle uma célula existente com seu runtime registrado:

```bash
openclaw fleet start acme
openclaw fleet stop acme
openclaw fleet restart acme
```

Esses comandos operam sobre o nome registrado do contêiner. Eles falham se o locatário for desconhecido ou se o runtime registrado não puder executar a operação.

## `fleet upgrade`

Baixe novamente a imagem registrada e substitua o contêiner da célula:

```bash
openclaw fleet upgrade acme
```

Mova a célula para outra imagem:

```bash
openclaw fleet upgrade acme --image ghcr.io/openclaw/openclaw:<version>
```

A atualização baixa a imagem de destino, inspeciona o contêiner existente e a rede por célula, interrompe e remove o contêiner e, em seguida, recria e inicia esse contêiner. A substituição preserva a mesma porta do host, os diretórios de dados, a rede bridge por célula, o perfil de runtime, os limites de recursos, a política de reinicialização, o ambiente gerenciado pelo Fleet e os valores originalmente fornecidos com `--env`. O estado montado sobrevive à substituição do contêiner; o ambiente padrão da imagem pode mudar conforme a imagem de destino.

A substituição só é confirmada depois que seu Gateway responde a `/healthz` na porta de loopback da célula, de acordo com o contrato de integridade usado pelo arquivo compose oficial. Uma substituição que encerra, entra em um ciclo de falhas ou não fica íntegra em cerca de um minuto é removida, e o contêiner anterior é restaurado, para que uma imagem com defeito não derrube uma célula em funcionamento.

O token do Gateway não é armazenado intencionalmente no registro do Fleet. Antes de remover o contêiner antigo, o Fleet lê seu ambiente e transfere `OPENCLAW_GATEWAY_TOKEN` para o substituto. Não remova manualmente o contêiner antigo antes de uma atualização se o token não estiver em nenhum outro local sob seu controle.

## `fleet backup` e `fleet restore`

Faça backup de uma célula interrompida:

```bash
openclaw fleet stop acme
openclaw fleet backup acme --out ./acme.tgz
```

Restaure esse arquivo na célula registrada:

```bash
openclaw fleet restore acme --from ./acme.tgz
```

Esses comandos exigem privilégios de operador do host. Os arquivos contêm o estado do tenant e segredos de autenticação, são criados com o modo `0600` e devem ser armazenados como credenciais. O backup recusa uma célula em execução para que o estado do SQLite seja capturado de forma consistente. A restauração recusa uma célula em execução, a menos que `--force` seja fornecido, substitui apenas o estado desse tenant, troca o token do Gateway e exibe o novo token uma única vez. O Fleet faz backup de um tenant por vez; o backup de todos os tenants é uma ação separada do operador.

Ambos os comandos aceitam `--max-bytes <bytes>` para limitar os dados de arquivo armazenados ou extraídos, e ambos aplicam o mesmo limite fixo de um milhão de segmentos de caminho no arquivo, para que arquivos maliciosos contendo apenas metadados não possam esgotar os inodes do host e para que todo backup aceito continue restaurável. O backup aceita `--out <path>`, e ambos os comandos oferecem suporte a `--json`.

Os arquivos contêm apenas arquivos comuns e diretórios. O backup nunca segue nem armazena links simbólicos, links físicos, sockets ou nós de dispositivo; as quantidades de itens ignorados são informadas no resultado. A restauração rejeita arquivos que contenham qualquer outro tipo de entrada. Árvores de links simbólicos recriáveis, como o `node_modules` do workspace, devem ser reinstaladas dentro da célula após uma restauração.

## `fleet doctor`

Audite todas as células ou um tenant sem alterar o estado do runtime ou do sistema de arquivos:

```bash
openclaw fleet doctor
openclaw fleet doctor acme --json
```

O Doctor verifica a localidade do runtime, os rótulos de propriedade, a integridade, o reforço de segurança, os limites de recursos, a vinculação da porta de loopback, a presença do token, a propriedade da rede e o modo de saída, além das permissões do diretório de estado privado. Os avisos descrevem células interrompidas ou diferenças de propriedade; qualquer verificação que falhar define um código de saída do processo diferente de zero.

## `fleet rm`

Remova uma célula interrompida do runtime e do registro, mantendo os dados do tenant:

```bash
openclaw fleet rm acme
```

Um contêiner em execução exige `--force`:

```bash
openclaw fleet rm acme --force
```

Remova permanentemente também os dados da célula:

```bash
openclaw fleet rm acme --purge-data --force
```

O Fleet remove o contêiner da célula antes de remover sua rede bridge dedicada. `--purge-data` exige `--force`. Antes da exclusão recursiva, o Fleet resolve as duas raízes pertencentes ao Fleet e os dois diretórios por tenant. Cada destino deve ser exatamente o diretório final esperado do tenant, estar estritamente dentro de sua raiz e não ser um link simbólico. Essas verificações de contenção impedem que um caminho de registro corrompido ou um link simbólico entre tenants redirecione a exclusão para outro local.

A limpeza pode ser repetida quando um diretório de tenant exatamente esperado já estiver ausente. Isso permite que uma invocação posterior conclua a limpeza após uma falha parcial do sistema de arquivos, sem flexibilizar as verificações de caminho para os diretórios que ainda existem.

## Layout de armazenamento e contêineres

O estado da célula e as chaves de criptografia do perfil de autenticação usam caminhos separados por tenant no host, dentro do diretório de estado ativo do OpenClaw:

```text
<state-dir>/fleet/cells/<tenant>/
<state-dir>/fleet/auth-profile-secrets/<tenant>/
```

O primeiro diretório é montado em `/home/node/.openclaw`. O segundo é montado em `/home/node/.config/openclaw`, correspondendo à montagem da chave de criptografia da configuração oficial do Docker. Portanto, a chave de criptografia não fica exposta sob a montagem de estado comum nem é incluída quando apenas o diretório de estado da célula é incluído em backup ou compartilhado. Ambos os diretórios sobrevivem à remoção e à atualização normais; `fleet rm --purge-data --force` exclui ambos após verificações de contenção separadas.

Antes da primeira inicialização, o Fleet inicializa a configuração da célula com `gateway.mode=local`, autenticação por token, vinculação ao contêiner na LAN e origens da Control UI para a porta alocada no host. O valor do token não é gravado nessa configuração; ele permanece no ambiente do contêiner.

O Fleet fixa os caminhos do contêiner da imagem oficial com estes valores de ambiente:

| Variável                 | Valor no contêiner                    |
| ------------------------ | ------------------------------------- |
| `HOME`                   | `/home/node`                          |
| `OPENCLAW_HOME`          | `/home/node`                          |
| `OPENCLAW_STATE_DIR`     | `/home/node/.openclaw`                |
| `OPENCLAW_CONFIG_PATH`   | `/home/node/.openclaw/openclaw.json`  |
| `OPENCLAW_WORKSPACE_DIR` | `/home/node/.openclaw/workspace`      |
| `OPENCLAW_GATEWAY_TOKEN` | Token da célula gerado ou fornecido   |

Por padrão, a imagem oficial usa o usuário `node`, não root, com UID 1000. O Fleet mantém as montagens bind privadas com modo `0700` graváveis sem torná-las acessíveis a todos. O Docker executado como root executa a célula com o UID e o GID não root do usuário que fez a invocação; o Docker sem root usa o UID 0 do contêiner, que é mapeado para o usuário não privilegiado do host que fez a invocação dentro do namespace de usuário do daemon. O Podman usa `keep-id` com o UID e o GID do usuário que fez a invocação. Quando o próprio Fleet é executado como root em um runtime executado como root, ele mantém o usuário da imagem e atribui os arquivos iniciais da montagem ao UID/GID 1000.

Em hosts com SELinux, as montagens do Docker e do Podman recebem uma reclassificação privada `:Z`. Se você restaurar ou realocar dados da célula, mantenha os caminhos montados via bind graváveis pelo usuário efetivo do contêiner. O perfil é compatível com execução sem root, mas o Docker ou o Podman já deve estar configurado para operação sem root no host; o Fleet não converte um daemon executado como root em um daemon sem root.

## Perfil de segurança

O Fleet aplica o seguinte perfil a todas as células:

| Controle                 | Perfil aplicado                                       | Motivo                                                                                                     |
| ------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Recursos do Linux        | `--cap-drop=ALL`                                      | O Gateway é um processo Node.js e não precisa de recursos adicionais do Linux.                             |
| Elevação de privilégios  | `--security-opt no-new-privileges`                    | Impede que processos obtenham privilégios por meio de binários setuid ou setgid.                            |
| Processo init            | `--init`                                              | Coleta processos descendentes e encaminha sinais do ciclo de vida do contêiner.                            |
| Limite de processos      | `--pids-limit 512` por padrão                         | Limita o esgotamento por fork e processos.                                                                 |
| Limite de memória        | `--memory 2g` por padrão                              | Limita o uso de memória da célula.                                                                         |
| Limite de CPU            | `--cpus 2` por padrão                                 | Limita o uso de CPU da célula.                                                                             |
| Disco da camada gravável | `--disk` opcional                                     | Limita a camada do contêiner quando o backend de armazenamento do runtime oferece suporte a cotas.         |
| Política de reinício     | `--restart unless-stopped`                            | Reinicia uma célula com falha sem substituir uma interrupção intencional.                                  |
| Publicação no host       | Somente `127.0.0.1:<host-port>:18789`                 | Mantém o Gateway fora das interfaces curinga do host.                                                      |
| Rede da célula           | Uma rede bridge ou interna do Podman por célula       | Separa o tráfego por IP dos contêineres e, opcionalmente, bloqueia o tráfego de saída do Podman.            |
| Identidade do contêiner  | Mapeamento de usuário correspondente ao host          | Mantém as montagens bind privadas graváveis sem conceder acesso global.                                    |
| Estado persistente       | Montagens por célula; nenhuma montagem compartilhada  | Mantém a configuração, as credenciais, as sessões e os workspaces do tenant na árvore de dados desse tenant. |
| Comando do contêiner     | `node dist/index.js gateway --bind lan --port 18789`  | Escuta na rede do contêiner para que o mapeamento da porta do host somente em loopback possa alcançá-lo.    |

O Fleet nunca monta `/var/run/docker.sock`, usa `--privileged` ou a rede do host, nem adiciona recursos. A bridge por célula é um limite de separação entre células, não um firewall de saída: as células mantêm o tráfego de saída de rede necessário para provedores e canais. Coloque na frente da porta de loopback um proxy, túnel SSH ou configuração de tailnet que corresponda à sua implantação. `http://127.0.0.1:<port>` só pode ser acessado diretamente pelo host do Fleet.

Esse perfil separa os contêineres dos tenants, mas não protege os tenants contra o operador do Fleet, o administrador do runtime de contêineres ou um host comprometido. Consulte [Hospedagem multi-tenant](/gateway/multi-tenant-hosting) para ver o modelo de confiança completo e opções de isolamento mais fortes.

## Tratamento de tokens

Por padrão, `fleet create` gera um token hexadecimal do Gateway com 32 caracteres, criptograficamente aleatório, e o exibe uma única vez no resultado da criação. Armazene-o no gerenciador de segredos aprovado e evite registrar a saída da criação em logs.

`--gateway-token` coloca um token personalizado nos argumentos do processo local, que podem ser mantidos no histórico do shell ou ficar visíveis nas listagens de processos. Prefira o token gerado, a menos que um fluxo de trabalho existente de gerenciamento de segredos exija um valor fornecido.

O token e todos os valores passados com `--env` ficam no ambiente do contêiner. O Fleet os grava em um arquivo de ambiente temporário com modo `0600`, passa ao Docker ou ao Podman apenas o caminho desse arquivo e o remove depois que o comando do runtime termina. Os valores digitados explicitamente em `openclaw fleet create --gateway-token ...` ou `--env KEY=VALUE` ainda podem ficar visíveis nos argumentos do processo externo `openclaw` e no histórico do shell.

Os valores do ambiente do contêiner não ficam ocultos do operador confiável do host: os administradores do Docker ou do Podman podem lê-los inspecionando o contêiner. A observação "exibido uma única vez" do Fleet descreve a saída normal da CLI, não uma proteção contra o administrador do host.

## Relacionados

- [Hospedagem multi-tenant](/gateway/multi-tenant-hosting)
- [Docker](/pt-BR/install/docker)
- [Podman](/pt-BR/install/podman)
- [Segurança do Gateway](/pt-BR/gateway/security)
