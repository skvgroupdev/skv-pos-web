import api from "./axios";

export interface User {
  _id: string;
  username: string;
  name: string;
  roles: string[];
  employeeCode?: string;
  userid: string;
  phone?: string;
  loginPhone?: string;
  address?: string;
  status: string;
}

export interface CreateUserDto {
  username: string;
  password?: string;
  name: string;
  roles: string[];
  employeeCode?: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  name?: string;
  roles?: string[];
  employeeCode?: string;
  phone?: string;
  address?: string;
}

export const getUsers = async (page = 1, limit = 10) => {
  const response = await api.get(`/users?page=${page}&limit=${limit}`);
  return response.data;
};

export const createUser = async (data: CreateUserDto) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUser = async (id: string, data: UpdateUserDto) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
