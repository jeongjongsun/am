package com.am.backoffice;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.am.backoffice.mapper")
public class BackofficeApplication {

  public static void main(String[] args) {
    SpringApplication.run(BackofficeApplication.class, args);
  }
}
