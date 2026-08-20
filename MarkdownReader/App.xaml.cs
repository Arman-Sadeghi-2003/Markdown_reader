using System.Windows;

namespace MarkdownReader
{
	/// <summary>
	/// Interaction logic for App.xaml
	/// </summary>
	public partial class App : Application
	{
		protected override void OnStartup(StartupEventArgs e)
		{
			base.OnStartup(e);

			// Register .md association on first launch (silent, non-blocking)
			Task.Run(FileAssociation.Register);

			var window = new MainWindow();
			window.Show();

			// If launched by double-clicking a .md file, the path is in args[0]
			string? path = null;
			if (e.Args.Length > 0)
				path = e.Args[0];
			if (!string.IsNullOrEmpty(path))
			{
				window.WebViewReady += (_, _) =>
				{
					window.Dispatcher.Invoke(() => window.OpenFile(path));
				};
			}
		}
	}

}
