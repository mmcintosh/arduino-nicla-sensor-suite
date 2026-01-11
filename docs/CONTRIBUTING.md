# Contributing to Arduino Nicla Sensor Suite

Thank you for considering contributing to this project! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, browser)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please include:
- Clear description of the feature
- Use cases and benefits
- Any implementation ideas

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Test thoroughly**:
   ```bash
   npm install
   npm run db:migrate
   npm run dev
   # Test in browser
   ```
5. **Commit with clear messages**: `git commit -m "Add amazing feature"`
6. **Push to your fork**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Style

- Use TypeScript for backend code
- Follow existing code formatting
- Add comments for complex logic
- Update documentation if needed

### Testing

Before submitting:
- [ ] Code runs locally (`npm run dev`)
- [ ] Database migrations work (`npm run db:migrate`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Browser console has no errors
- [ ] Arduino connection works
- [ ] Data recording works
- [ ] Export features work

### Documentation

If you change functionality:
- Update README.md
- Update relevant .md files
- Add comments to code
- Update API documentation if applicable

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/arduino-nicla-sensor-suite.git
cd arduino-nicla-sensor-suite

# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start dev server
npm run dev
```

## Project Structure

- `src/` - Backend TypeScript code
- `public/` - Frontend JavaScript/CSS
- `migrations/` - Database schema
- `docs/` - Documentation markdown files

## Questions?

Feel free to open an issue for questions or join discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
