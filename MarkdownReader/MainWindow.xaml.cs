using Microsoft.Web.WebView2.Core;
using System.IO;
using System.Text.Json;
using System.Windows;

namespace MarkdownReader
{
	/// <summary>
	/// Interaction logic for MainWindow.xaml
	/// </summary>
	public partial class MainWindow : Window
	{
		public event EventHandler? WebViewReady;

		// Base directory of our bundled web assets
		private static readonly string WebRoot =
			Path.Combine(AppContext.BaseDirectory, "Web");

		public MainWindow()
		{
			InitializeComponent();
			InitializeWebViewAsync();
		}

		// ── WebView2 initialization ───────────────────────────────────────────────

		private async void InitializeWebViewAsync()
		{
			var userDataFolder = Path.Combine(
				Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
				"MarkdownReader");

			var env = await CoreWebView2Environment.CreateAsync(
				browserExecutableFolder: null,
				userDataFolder: userDataFolder);

			await WebView.EnsureCoreWebView2Async(env);

			WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
				"app.local",
				WebRoot,
				CoreWebView2HostResourceAccessKind.Allow);

			WebView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
			WebView.CoreWebView2.Settings.AreDevToolsEnabled = false;

			// Wait for the page to finish loading before declaring ready
			WebView.CoreWebView2.NavigationCompleted += (s, e) =>
			{
				WebViewReady?.Invoke(this, EventArgs.Empty);
			};

			WebView.CoreWebView2.Navigate("https://app.local/viewer.html");
		}

		// ── Public API: open a file ───────────────────────────────────────────────

		public async void OpenFile(string path)
		{
			if (!File.Exists(path)) return;
			if (!path.EndsWith(".md", StringComparison.OrdinalIgnoreCase)) return;

			var markdown = await File.ReadAllTextAsync(path);
			var fileName = Path.GetFileName(path);

			// Update title bar
			TitleLabel.Text = fileName;
			SubtitleLabel.Text = path;
			Title = $"{fileName} — Markdown Reader";

			// Push content into the WebView via postMessage
			// JSON-encode the string so all special chars / newlines survive
			var payload = JsonSerializer.Serialize(markdown);
			await WebView.CoreWebView2.ExecuteScriptAsync(
				$"window.__renderMarkdown({payload});");
		}

		// ── Drag & Drop ───────────────────────────────────────────────────────────

		private void Window_DragOver(object sender, DragEventArgs e)
		{
			if (e.Data.GetDataPresent(DataFormats.FileDrop))
			{
				var files = (string[])e.Data.GetData(DataFormats.FileDrop)!;
				if (files.Any(f => f.EndsWith(".md", StringComparison.OrdinalIgnoreCase)))
				{
					e.Effects = DragDropEffects.Copy;
					DropOverlay.Visibility = Visibility.Visible;
					e.Handled = true;
					return;
				}
			}
			e.Effects = DragDropEffects.None;
			e.Handled = true;
		}

		private void Window_Drop(object sender, DragEventArgs e)
		{
			DropOverlay.Visibility = Visibility.Collapsed;

			if (!e.Data.GetDataPresent(DataFormats.FileDrop)) return;

			var files = (string[])e.Data.GetData(DataFormats.FileDrop)!;
			var mdFile = files.FirstOrDefault(
				f => f.EndsWith(".md", StringComparison.OrdinalIgnoreCase));

			if (mdFile != null)
				OpenFile(mdFile);
		}

		// Hide the overlay when the drag leaves the window
		protected override void OnDragLeave(DragEventArgs e)
		{
			base.OnDragLeave(e);
			DropOverlay.Visibility = Visibility.Collapsed;
		}

		// ── Open File dialog ──────────────────────────────────────────────────────

		private void OpenButton_Click(object sender, RoutedEventArgs e)
		{
			var dialog = new Microsoft.Win32.OpenFileDialog
			{
				Title = "Open Markdown File",
				Filter = "Markdown Files (*.md)|*.md|All Files (*.*)|*.*",
				CheckFileExists = true
			};

			if (dialog.ShowDialog() == true)
				OpenFile(dialog.FileName);
		}
	}
}
