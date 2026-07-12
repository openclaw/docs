---
read_when:
    - Você está hospedando o OpenClaw para vários usuários ou organizações
    - Você precisa escolher um limite de isolamento para as cargas de trabalho dos locatários
summary: Hospede vários domínios de confiança de locatários como uma célula isolada do Gateway do OpenClaw por locatário
title: Hospedagem multi-tenant
x-i18n:
    generated_at: "2026-07-12T15:14:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ffb873c7b9e7e463d932ad35eb009c34218447a051ac065c151ba57dc71b799
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hospedagem multilocatário

O modelo de segurança padrão do OpenClaw estabelece um limite de operador confiável por Gateway, e não isolamento entre locatários hostis dentro de um único Gateway compartilhado. Portanto, hospedar usuários ou organizações que não compartilham um limite de confiança exige executar uma instância completa e separada do OpenClaw para cada locatário.

O `openclaw fleet` chama cada instância isolada de **célula**. Uma célula é um Gateway completo em um contêiner reforçado, com estado, credenciais, espaço de trabalho, contas de canais, token e porta do host restrita ao loopback próprios.

O Fleet é **experimental**: seus comandos, sinalizadores e perfil de contêiner podem mudar entre versões sem um período de descontinuação enquanto a interface se estabiliza.

O Fleet é testado em hosts Linux e macOS. Atualmente, hosts Windows não são testados.

## Por que cada locatário precisa de uma célula

Um operador autenticado em um Gateway exerce uma função confiável no plano de controle. Os IDs de sessão selecionam o roteamento; eles não autorizam um locatário em relação a outro. O isolamento do agente pode reduzir o impacto de conteúdo não confiável e da execução de ferramentas, mas não transforma um Gateway compartilhado em um limite de autorização entre locatários.

Use uma célula por locatário para que cada domínio de confiança tenha um processo do Gateway, um contêiner, uma árvore de estado persistente e uma credencial do Gateway separados. Isso segue o [modelo de segurança do Gateway](/pt-BR/gateway/security): não coloque usuários mutuamente não confiáveis no mesmo processo do OpenClaw nem sob o mesmo usuário do sistema operacional.

## Arquitetura

A CLI do Fleet é um supervisor de ciclo de vida executado no host. Ela registra as células no banco de dados de estado do OpenClaw e solicita a um runtime local do Docker ou Podman que crie, inspecione, inicie, interrompa, substitua e remova seus contêineres. Endpoints remotos de runtime são rejeitados porque os caminhos de montagem e URLs de loopback do Fleet pertencem ao host local; hosts remotos de células ficam adiados até que tenham um contrato explícito de armazenamento e endpoints. O Fleet não atua como proxy de mensagens dos locatários nem adiciona um caminho de dados compartilhado no nível da aplicação entre as células.

Cada célula executa a imagem oficial `ghcr.io/openclaw/openclaw` em sua própria rede bridge definida pelo usuário. Bridges separadas impedem tráfego direto por IP de contêiner entre células, mantendo o acesso NAT de saída para provedores e canais. O tráfego de saída é irrestrito por padrão. Células do Podman podem usar `--network internal` para bloquear o tráfego de saída, preservando a porta de loopback publicada do Gateway. Redes internas do Docker interrompem essa porta publicada, portanto o Fleet rejeita essa combinação; em vez disso, aplique a política de tráfego de saída do Docker com regras de firewall do host, como a cadeia `DOCKER-USER`. O Gateway da célula escuta na porta `18789` dentro do contêiner, enquanto o runtime a publica somente em `127.0.0.1:<allocated-port>` no host. Quando o acesso remoto for necessário, um operador pode colocar um proxy reverso aprovado, um túnel SSH ou uma tailnet na frente desse endpoint de loopback.

O estado persistente do Gateway vem de `<state-dir>/fleet/cells/<tenant>/` e é montado em `/home/node/.openclaw`. As chaves de criptografia dos perfis de autenticação vêm do caminho separado `<state-dir>/fleet/auth-profile-secrets/<tenant>/` no host e são montadas em `/home/node/.config/openclaw`, em conformidade com o [layout oficial de persistência do Docker](/pt-BR/install/docker#storage-and-persistence). A chave não fica aninhada sob a montagem comum de estado. As contas de canais de cada locatário terminam dentro da célula que as possui, portanto não há uma conta de canal compartilhada nem um roteador compartilhado de mensagens de entrada no MVP do Fleet.

A imagem oficial usa por padrão o usuário não raiz `node`, com UID 1000. O Fleet usa mapeamentos de usuário compatíveis com o host para manter as montagens privadas graváveis: o Podman usa `keep-id`, o Docker executado como raiz usa a identidade não raiz que o invocou, e o Docker sem raiz mapeia o usuário raiz do contêiner para o usuário sem privilégios do daemon. O Docker e o Podman aplicam uma remarcação privada `:Z` quando o SELinux está ativo no host. O perfil do contêiner evita recursos privilegiados do host e é compatível com operação sem raiz, mas essa operação é uma escolha e um pré-requisito do runtime do host, não algo que o Fleet habilita automaticamente.

## Limite de confiança

A multilocação protege os locatários uns dos outros. O operador do Fleet e o host são considerados confiáveis por todos os locatários. A resistência a um host comprometido não é um objetivo.

Isso significa que um administrador do host pode inspecionar a configuração e o ambiente dos contêineres, ler os dados montados das células, substituir imagens ou entrar nos contêineres. Os tokens do Gateway e os valores passados com `--env` ficam visíveis para um administrador por meio da inspeção do Docker ou Podman. Use controles do host, políticas de acesso administrativo, monitoramento, backups e um gerenciador de segredos aprovado de maneira adequada.

A configuração básica impede a exposição acidental da rede por curingas e remove mecanismos comuns de escalonamento de privilégios em contêineres, mas não torna seguro um host não confiável.

## Níveis de isolamento

Escolha o limite adequado aos locatários que você hospeda:

1. **Configuração básica de contêiner reforçado.** O Fleet remove todos os recursos do Linux, habilita `no-new-privileges`, aplica limites de PID, memória, CPU e, opcionalmente, de disco na camada gravável, usa montagens persistentes e redes separadas para cada célula e publica somente no loopback do host. A rede bridge mantém o tráfego de saída irrestrito; use `--network internal` no Podman ou uma política de firewall do host para o Docker quando uma célula não puder iniciar conexões de saída. Esse é o perfil MVP para locatários que confiam no operador e no host.
2. **Isolamento mais forte por contêiner ou VM.** Para cargas de trabalho de maior risco, configure o Docker ou Podman para usar um runtime de isolamento OCI mais robusto, como gVisor ou Kata Containers, ou coloque as células em microVMs. Essa é uma configuração do runtime ou da infraestrutura; a opção `--runtime docker|podman` do Fleet escolhe a CLI de contêiner, não o mecanismo de isolamento OCI. Consulte os [runtimes alternativos de contêiner](https://docs.docker.com/engine/daemon/alternative-runtimes/) do Docker e o [guia do runtime de VM do Docker](/pt-BR/install/docker-vm-runtime).
3. **Máquinas separadas para locatários hostis.** Não coloque locatários hostis no mesmo processo do OpenClaw nem sob o mesmo usuário do sistema operacional. Quando os locatários não confiam no mesmo operador do host ou precisam de um limite administrativo mais forte, use VMs ou hosts físicos separados, com administração de runtime separada.

Nenhum nível dessa hierarquia altera o modelo de confiança da aplicação OpenClaw: um Gateway continua sendo um único domínio de operador confiável.

## Início rápido

Crie uma célula. O comando exibe uma única vez um token gerado para o Gateway, portanto armazene-o imediatamente:

```bash
openclaw fleet create acme
```

No host do Fleet, abra a URL `http://127.0.0.1:<port>` informada, autentique-se com o token desse locatário e configure as credenciais dos provedores e as contas de canais dentro da célula.

Verifique o estado do contêiner e a disponibilidade do Gateway:

```bash
openclaw fleet status acme
```

Atualize preservando a porta do host, os dados montados, o perfil de recursos, o ambiente fornecido pelo usuário e o token do Gateway:

```bash
openclaw fleet upgrade acme
```

Remova o contêiner e o registro no banco de dados, mantendo os dados do locatário:

```bash
openclaw fleet rm acme --force
```

Para excluir também os dados persistentes do locatário, adicione `--purge-data`. A exclusão definitiva exige `--force`, é irreversível e realiza uma verificação de contenção do caminho resolvido antes de excluir qualquer conteúdo:

```bash
openclaw fleet rm acme --purge-data --force
```

Consulte a [referência da CLI `openclaw fleet`](/cli/fleet) para ver todos os comandos e opções.

## Adiado no MVP

A primeira versão do Fleet deixa deliberadamente estas áreas para projetos futuros:

- Contas de canais compartilhadas ou um roteador de entrada compartilhado
- Processos de host simplificados para cada locatário em vez de instâncias completas do OpenClaw
- Hosts remotos de células gerenciados por um único supervisor
- Um portal de autoatendimento para locatários, um plano de faturamento ou uma interface de administração delegada

Esses recursos exigem contratos explícitos de identidade, roteamento, autorização e domínios de falha. Eles não devem ser aproximados por meio do compartilhamento de um Gateway ou de suas credenciais entre locatários. Eles também não pertencem ao escopo do Fleet: o Fleet permanece um supervisor de ciclo de vida para um único host, enquanto frotas com várias máquinas e controle de identidade pertencem a uma camada dedicada de plano de controle acima dele.

## Relacionados

- [`openclaw fleet`](/cli/fleet)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Vários gateways](/pt-BR/gateway/multiple-gateways)
- [Docker](/pt-BR/install/docker)
- [Podman](/pt-BR/install/podman)
