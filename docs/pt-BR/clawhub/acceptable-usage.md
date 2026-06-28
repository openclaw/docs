---
read_when:
    - Analisando envios em busca de abuso ou violações de política
    - Escrever documentos de moderação ou runbooks de revisores
    - Decidindo se uma skill deve ser ocultada ou um usuário banido
sidebarTitle: Acceptable Usage
summary: 'Política do mercado: o que o ClawHub permite e o que não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-06-28T05:07:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso Aceitável

ClawHub hospeda skills, plugins, pacotes e metadados de marketplace para OpenClaw.
Use esta página para decidir se o conteúdo ou o comportamento de publicação pertence ao
ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela pede que os usuários executem, a como ela
se representa e a como os publicadores usam as superfícies de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e Segurança da Conta](/pt-BR/clawhub/moderation). Para reivindicações de copyright ou outros direitos,
consulte [Solicitações de Direitos de Conteúdo](/pt-BR/clawhub/content-rights).

## Conteúdo permitido

ClawHub aceita conteúdo que seja útil, compreensível e publicado de boa
fé.

| Categoria                                         | Permitido quando                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvedores                           | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                               |
| Fluxos de trabalho de UI, dados e automação               | O escopo é claro, as credenciais necessárias são explícitas e ações arriscadas incluem caminhos de revisão, simulação, prévia ou confirmação. |
| Segurança defensiva, moderação e análise de abuso | A ferramenta é apresentada para análise autorizada, preserva evidências e mantém claros os limites de aprovação humana.                          |
| Fluxos de trabalho pessoais ou de equipe                       | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                                            |
| Catálogos mantidos                              | Cada listagem é distinta, útil, descrita com precisão e razoavelmente mantida.                                                |

O contexto importa. O mesmo tópico pode ser aceitável em um ambiente defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como um fluxo de trabalho de abuso.

## Conteúdo não permitido

ClawHub não hospeda conteúdo cujo principal objetivo seja abuso, engano, execução
insegura ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou bypass de segurança                      | Bypass de autenticação, tomada de controle de conta, abuso de limite de taxa, tomada de controle de chamada ao vivo ou agente, roubo reutilizável de sessão ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                                                                                   |
| Abuso de plataforma e evasão de banimento                              | Contas furtivas após banimentos, aquecimento ou cultivo de contas, engajamento falso, automação de múltiplas contas, publicações em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                          |
| Fraude, golpes e fluxos de trabalho financeiros enganosos             | Certificados ou faturas falsos, fluxos de pagamento enganosos, abordagem para golpes, prova social falsa, fluxos de trabalho de identidade sintética para fraude ou ferramentas de gasto/cobrança sem aprovação humana clara.                                                                                                                    |
| Enriquecimento invasivo de privacidade ou vigilância                 | Coleta de contatos para spam, doxxing, perseguição, extração de leads associada a abordagem não solicitada, monitoramento oculto, correspondência biométrica sem consentimento ou uso de dados vazados ou dumps de violação.                                                                                                                  |
| Representação sem consentimento ou manipulação de identidade       | Troca de rosto, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para se passar por alguém ou enganar.                                                                                                                                                                                                 |
| Conteúdo sexual explícito ou geração adulta com segurança desativada | Geração de imagens, vídeos ou conteúdo NSFW; wrappers de conteúdo adulto em torno de APIs de terceiros; ou listagens cujo principal objetivo seja conteúdo sexual explícito.                                                                                                                                                       |
| Requisitos de execução ocultos, inseguros ou enganosos        | Comandos de instalação ofuscados, instaladores pipe-to-shell, como conteúdo baixado executado com `sh` ou `bash` sem revisabilidade clara, requisitos não declarados de segredo ou chave privada, execução remota de `npx @latest` sem revisabilidade clara ou metadados que ocultam o que a listagem realmente precisa para executar. |
| Material que infringe copyright ou viola direitos           | Republicar skill, plugin, documentação, ativos de marca ou código proprietário de outra pessoa sem permissão; violar termos de licença; ou se passar pelo autor ou publicador original.                                                                                                                            |

## Comportamento de marketplace não permitido

ClawHub também analisa como os publicadores usam o marketplace. Não use ClawHub para
manipular descoberta, métricas, sinais de confiança, sistemas de moderação ou a
atenção dos usuários.

Comportamento de marketplace não permitido inclui:

- publicar em massa grandes quantidades de listagens de baixo esforço, duplicadas, provisórias ou
  geradas por máquina que não parecem ter valor real para os usuários
- inundar superfícies de busca ou categoria com skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza de origem
  ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de auto-instalação, contas falsas, atividade
  coordenada, engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evadir moderação, banimentos, limites de publicador ou
  análise do marketplace
- enganar usuários sobre propriedade, origem, capacidades, postura de segurança,
  requisitos de instalação ou afiliação a outro projeto ou publicador
- enviar repetidamente conteúdo que já foi ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

Publicação em alto volume não é automaticamente abuso. Catálogos grandes são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Catálogos grandes se tornam um problema de confiança e segurança quando
o volume é combinado com listagens superficiais, duplicadas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos de conteúdo

Se você acredita que conteúdo no ClawHub infringe seu copyright ou outros direitos, use
[Solicitações de Direitos de Conteúdo](/pt-BR/clawhub/content-rights). Não use denúncias normais do marketplace
para reivindicações de copyright ou direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Revisão e aplicação

ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, denúncias de usuários e
análise da equipe para identificar conteúdo inseguro ou comportamento de publicação abusivo. Um sinal
não prova abuso por si só; ele ajuda o ClawHub a decidir o que precisa de análise.

Podemos:

- ocultar, reter, remover, excluir de forma reversível ou, quando houver suporte para o tipo de recurso,
  excluir definitivamente listagens infratoras
- bloquear downloads ou instalações de releases inseguros
- revogar tokens de API
- excluir de forma reversível conteúdo associado
- restringir acesso de publicação
- banir infratores reincidentes ou graves

Não garantimos aplicação precedida de aviso para abuso óbvio. Consulte
[Moderação e Segurança da Conta](/pt-BR/clawhub/moderation) para denúncias, retenções de moderação,
listagens ocultas, banimentos e situação da conta.
