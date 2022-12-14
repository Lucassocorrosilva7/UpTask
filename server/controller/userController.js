import User from "../models/User.js";
import generateId from "../helpers/generateid.js";
import generateJWT from "../helpers/generateJWT.js";
import { emailRegister, emailForgotThePassword } from "../helpers/email.js";

const register = async (req, res) => {
  const { email } = req.body;
  const existUser = await User.findOne({ email });

  if (existUser) {
    const error = new Error("Esse usuário já está registrado");
    return res.status(400).json({ msg: error.message });
  }

  try {
    const user = new User(req.body);
    user.token = generateId();
    const userDB = await user.save();
    emailRegister({
      email: user.email,
      name: user.name,
      token: user.token,
    });

    res.json({
      msg: "Usuário criado com sucesso, Revise seu email para confirmar sua conta",
    });
    console.log(user);
  } catch (error) {
    console.log(error.message);
  }
};

const authentication = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Usuário não existe");
    return res.status(404).json({ msg: error.message });
  }
  if (!user.confirm) {
    const error = new Error("Sua conta não foi confirmada");
    return res.status(403).json({ msg: error.message });
  }
  if (await user.confirmPassword(password)) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateJWT(user._id),
    });
  } else {
    const error = new Error("Senha incorreta");
    return res.status(404).json({ msg: error.message });
  }
};

const confirm = async (req, res) => {
  const { token } = req.params;
  const userConfirm = await User.findOne({ token });
  if (!userConfirm) {
    const error = new Error("Token não é valido");
    return res.status(404).json({ msg: error.message });
  }

  try {
    userConfirm.confirm = true;
    userConfirm.token = "";
    await userConfirm.save();

    res.json({ msg: "Usuário confirmado" });
  } catch (error) {
    console.log(error);
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("Usuário não existe");
    return res.status(404).json({ msg: error.message });
  }

  try {
    user.token = generateId();
    await user.save();

    emailForgotThePassword({
      email: user.email,
      name: user.name,
      token: user.token,
    });

    res.json({ msg: "Enviamos um email com as instruções de recuperação" });
  } catch (error) {
    console.log(error);
  }
};

const proveToken = async (req, res) => {
  const { token } = req.params;
  const tokenValid = await User.findOne({ token });

  if (tokenValid) {
    res.json({ msg: "Token valido" });
  } else {
    const error = new Error("Token não é valido");
    return res.status(404).json({ msg: error.message });
  }
};

const newPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({ token });

  if (user) {
    user.password = password;
    user.token = "";
    try {
      await user.save();
      res.json({ msg: "Senha alterada com sucesso" });
    } catch (error) {
      console.log(error);
    }
  } else {
    const error = new Error("Token não é valido");
    return res.status(404).json({ msg: error.message });
  }
};

const perfil = (req, res) => {
  const { user } = req;
  res.json(user);
};

export {
  register,
  authentication,
  confirm,
  forgotPassword,
  proveToken,
  newPassword,
  perfil,
};
