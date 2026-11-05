# EmbodiedZip website

EmbodiedZip 项目网站。网站源码公开于 **[LxRoboticsLab/EmbodiedZip-website](https://github.com/LxRoboticsLab/EmbodiedZip-website)**，通过 GitHub Pages 发布：

**https://lxroboticslab.github.io/EmbodiedZip-website/**

研究框架仓库保持私有，网站在本公开仓库中独立开发和部署。本地目录为 `/mnt/sda1/EmbodiedZip-website`；原研究框架仓库仅保留 `main` 分支。本站仓库只包含网站、图示、测试和 Pages 工作流，不包含模型、推理代码、研究仓库历史、数据、权重或凭证。公开站点的链接指向本站内容和公开网站仓库。

## 本地查看

克隆公开网站仓库后，在仓库根目录运行（可使用已有 Conda 环境）：

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。

所有资源采用相对路径，兼容 GitHub Pages 项目子路径。

网站采用 HTML、CSS 和原生 ES modules，无需框架、打包或 npm 依赖。Google Fonts 可离线回退到系统字体；没有第三方 JS、分析跟踪或模型运行依赖。

## 文件说明

- `index.html`：介绍、排行榜、任务展示、效率分析、Policy Serving、评估方法。
- `styles.css`：响应式布局与样式。
- `data.mjs`：规划配置、任务类别、指标定义与筛选/排序/CSV 逻辑。
- `app.mjs`：交互、键盘可访问 tabs、配置对比、任务切换与导出。
- `assets/`：原创 SVG 示意图，不是实机记录。
- `tests/`：数据真实性与筛选、排序、CSV 边界测试。
- `.github/workflows/pages.yml`：公开网站仓库的 Pages 工作流。

## Project status

**Framework preview — no measured results published.**

已建立共享数据契约、推理协议、配置查看工具、同步接口模拟示例和 policy serving 接口骨架。首个模型与 benchmark、加速算法、执行后端、远程服务和真实评估仍待接入。

网站所有实验指标为 `null`，显示为 `—`，CSV 导出为空字段。规划配置不是已运行的实验；benchmark 候选不是已接入能力；任务类别是示意；视频与图表为标记清楚的 placeholder。更新结果时需附模型、benchmark、硬件和可复现运行来源。真实图表渲染与分布数据绑定将在首批结果接入时实现。

近期方向：首个模型和同步闭环基线 → Policy Server / Client → 完整运行清单与指标 → 单项优化消融 → 异步 / RTC 与多 benchmark。

设计参考 [AA-Robotics](https://artificialanalysis.ai/articles/aa-robotics#leaderboard) 的信息层次。本站没有复制其品牌、实验结果或视频。

## 验证

Node.js 20+，无需安装依赖：

```bash
npm run check
```

已用 Chromium 验证搜索、筛选、对比、任务切换、指标 tabs、键盘操作、CSV 下载及 320–1440 px 响应式布局。

## 发布与维护

公开网站仓库 `main` 分支更新后，工作流自动执行检查并发布 Pages。首次发布设置：**Settings → Pages → Source → GitHub Actions**。部署成功后，站点地址如上。

直接在本仓库维护网站，Pages 部署使用 `.github/workflows/pages.yml`：

```bash
cd /mnt/sda1/EmbodiedZip-website
# 修改网站内容
npm run check
git add <修改的文件>
git commit -m "Update project website"
git push origin main
```

研究框架与网站使用独立仓库及 Git 历史。提交到网站仓库的内容会公开，请仅提交网站所需的源码与资源。
